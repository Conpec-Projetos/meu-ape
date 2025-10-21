import { getProperties } from "@/firebase/properties/service";
import { FirebaseError } from "firebase/app";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const { q, minPrice, maxPrice, bedrooms, bathrooms, garages, cursor } = queryParams;
        const pageSize = 15; // Defina o tamanho da página desejado

        // 1. Defina os parâmetros para a consulta primária no Firestore
        const primaryQueryParams: { [key: string]: string } = {};
        if (q) primaryQueryParams.q = q; // Prioriza busca de texto, se presente
        if (cursor) primaryQueryParams.cursor = cursor; // Passa o cursor para paginação primária

        // 2. Execute a consulta primária (agora simplificada)
        // A função getProperties busca pageSize + 1 para checar hasNextPage
        const firestoreResult = await getProperties(primaryQueryParams, pageSize);
        const properties = firestoreResult.properties;

        // 3. Aplique filtros secundários no backend
        const minPriceNum = minPrice ? Number(minPrice) : null;
        const maxPriceNum = maxPrice ? Number(maxPrice) : null;
        const bedroomsFilter = bedrooms
            ? bedrooms
                  .split(",")
                  .map(Number)
                  .filter(n => !isNaN(n))
            : [];
        const bathroomsFilter = bathrooms
            ? bathrooms
                  .split(",")
                  .map(Number)
                  .filter(n => !isNaN(n))
            : [];
        const garagesFilter = garages
            ? garages
                  .split(",")
                  .map(Number)
                  .filter(n => !isNaN(n))
            : [];

        const filteredProperties = properties.filter(p => {
            const feats = p.searchableUnitFeats;
            if (!feats) return false; // Skip if searchableUnitFeats is missing

            // Filtro de Preço
            if (minPriceNum !== null && feats.maxPrice < minPriceNum) return false; // Imóvel muito barato
            if (maxPriceNum !== null && feats.minPrice > maxPriceNum) return false; // Imóvel muito caro

            // Filtro de Quartos (usando a estrutura de array do searchableUnitFeats)
            if (bedroomsFilter.length > 0 && !bedroomsFilter.some(bed => feats.bedrooms.includes(bed))) {
                return false;
            }
            // Filtro de Banheiros
            if (bathroomsFilter.length > 0 && !bathroomsFilter.some(bath => feats.baths.includes(bath))) {
                return false;
            }
            // Filtro de Garagens
            if (garagesFilter.length > 0 && !garagesFilter.some(garage => feats.garages.includes(garage))) {
                return false;
            }

            return true; // Passou por todos os filtros secundários
        });

        // 4. Retorna a resposta final
        // Usamos o nextPageCursor e hasNextPage retornados pela consulta primária.
        // Isso pode não ser 100% preciso após a filtragem secundária (pode indicar que há próxima página
        // mas ela acabar ficando vazia após a filtragem), mas é uma simplificação aceitável.
        // Uma lógica mais complexa exigiria buscar mais dados na etapa 2 ou outra estratégia.
        return NextResponse.json({
            properties: filteredProperties, // Envia a lista *após* a filtragem secundária
            nextPageCursor: firestoreResult.nextPageCursor, // Cursor da consulta primária
            hasNextPage: firestoreResult.hasNextPage, // Indicação baseada na consulta primária
        });
    } catch (error) {
        console.error("Error fetching properties:", error);
        const status = 500;
        let message = "Internal Server Error";
        let code = "UNKNOWN_ERROR";

        if (error instanceof FirebaseError) {
            message = `Firebase error: ${error.message}`;
            code = error.code;
            // Poderia ajustar o status baseado no código do Firebase se necessário
        } else if (error instanceof Error) {
            message = error.message;
        }

        return NextResponse.json({ message, code }, { status });
    }
}
