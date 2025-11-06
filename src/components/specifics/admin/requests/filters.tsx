"use client";

import { RequestStatusUrl, STATUS_FILTER_OPTIONS } from "@/components/specifics/admin/requests/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

interface RequestFiltersProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value?: RequestStatusUrl) => void;
    activeStatus?: RequestStatusUrl;
    statusOptions?: typeof STATUS_FILTER_OPTIONS;
}

export function RequestFilters({
    searchValue,
    onSearchChange,
    onStatusChange,
    activeStatus,
    statusOptions = STATUS_FILTER_OPTIONS,
}: RequestFiltersProps) {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value);
    };

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por cliente ou imóvel..."
                    className="pl-8"
                    value={searchValue}
                    onChange={handleInputChange}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => {
                    const isActive = option.urlValue === activeStatus || (!option.urlValue && !activeStatus);
                    return (
                        <Button
                            key={option.label}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => onStatusChange(option.urlValue)}
                            className="cursor-pointer"
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
