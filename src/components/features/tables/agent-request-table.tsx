"use client";

import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface AgentRequestTableProps {
  requests: AgentRegistrationRequest[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onReview: (request: AgentRegistrationRequest) => void;
}

export function AgentRequestTable({ requests, page, totalPages, onPageChange, onReview }: AgentRequestTableProps) {
    const formatDate = (date: Date | import("firebase/firestore").Timestamp) => {
        if (date instanceof Date) {
          return date.toLocaleDateString();
        }
        return new Date(date.seconds * 1000).toLocaleDateString();
    };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome do Solicitante</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>CRECI</TableHead>
            <TableHead>Data da Solicitação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.applicantData.fullName}</TableCell>
              <TableCell>{request.applicantData.email}</TableCell>
              <TableCell>{request.applicantData.creci}</TableCell>
              <TableCell>{formatDate(request.submittedAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" onClick={() => onReview(request)}>Analisar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page - 1);
              }}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(i + 1);
                }}
                isActive={page === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page + 1);
              }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
