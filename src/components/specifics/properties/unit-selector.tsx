
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export type UnitStructure = {
  [block: string]: string[];
};

interface UnitSelectorProps {
  structure: UnitStructure;
  onSelect: (block: string, category: string) => void;
  selectedBlock?: string;
  selectedCategory?: string;
}

export function UnitSelector({
  structure,
  onSelect,
  selectedBlock,
  selectedCategory,
}: UnitSelectorProps) {
  const [openBlock, setOpenBlock] = useState<string | null>(null);

  return (
    <div className="w-full space-y-2">
      {Object.entries(structure).map(([block, categories]) => (
        <Collapsible key={block} open={openBlock === block} onOpenChange={() => setOpenBlock(openBlock === block ? null : block)} className="border rounded-lg">
          <CollapsibleTrigger className="cursor-pointer flex justify-between items-center w-full p-4 font-medium bg-secondary/50 hover:bg-secondary/80 transition-colors">
            {block}
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openBlock === block ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2">
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category}>
                  <button
                    onClick={() => onSelect(block, category)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors cursor-pointer ${
                      selectedBlock === block && selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
