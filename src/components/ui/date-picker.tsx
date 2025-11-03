"use client";

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ptBR } from "react-day-picker/locale";

type DatePickerProps = {
    id?: string;
    label?: string;
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    locale?: unknown;
    buttonClassName?: string;
    fromYear?: number;
    toYear?: number;
};

export function DatePicker({
    id,
    label,
    value,
    onChange,
    placeholder = "Selecionar data",
    locale = ptBR,
    buttonClassName,
    fromYear,
    toYear,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const display = React.useMemo(() => {
        return value ? value.toLocaleDateString("pt-BR") : placeholder;
    }, [value, placeholder]);

    const fromY = fromYear ?? 1900;
    const toY = toYear ?? new Date().getFullYear() + 50;

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <Label htmlFor={id} className="px-1">
                    {label}
                </Label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id={id}
                        className={`justify-between font-normal ${buttonClassName ?? "w-full cursor-pointer"}`}
                    >
                        <span>{display}</span>
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        startMonth={new Date(fromY, 0)}
                        endMonth={new Date(toY, 11)}
                        onSelect={d => {
                            onChange(d);
                            setOpen(false);
                        }}
                        locale={locale as never}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
