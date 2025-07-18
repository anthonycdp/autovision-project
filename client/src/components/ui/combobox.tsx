import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  label: string
  value: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  allowCustomValue?: boolean
  onCustomValueCreate?: (value: string) => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  emptyText = "Nenhuma opção encontrada",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className,
  allowCustomValue = false,
  onCustomValueCreate,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = React.useMemo(() => {
    // Primeiro tenta encontrar a opção na lista
    const option = options.find((option) => option.value === value)
    if (option) return option
    
    // Se não encontrar e tiver um valor, cria uma opção temporária
    if (value && value.trim()) {
      return {
        label: value,
        value: value
      }
    }
    
    return null
  }, [options, value])

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue
    onValueChange?.(newValue)
    setOpen(false)
  }

  const handleCustomValue = () => {
    if (allowCustomValue && searchValue && onCustomValueCreate) {
      onCustomValueCreate(searchValue)
      setSearchValue("")
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {emptyText}
              {allowCustomValue && searchValue && (
                <div className="p-2 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomValue}
                    className="w-full"
                  >
                    Adicionar "{searchValue}"
                  </Button>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}