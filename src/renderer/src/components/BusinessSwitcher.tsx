import { useAuth } from "../context/AuthContext"
import { useSettings } from "../context/SettingsContext"
import { Button } from "@renderer/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@renderer/components/ui/dropdown-menu"
import { Store, Check, ChevronsUpDown, PlusCircle, Globe2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function BusinessSwitcher() {
  const { businesses, currentBusiness, switchBusiness, t } = useSettings();
  const { isEmployee, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!currentBusiness) return null;

  const canSwitch = !isEmployee && businesses.length > 1;

  const handleSelect = async (id: number) => {
    if (id === currentBusiness.id) return;
    await switchBusiness(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 rounded-full border-border/60 px-3 text-xs font-medium"
          disabled={!canSwitch}
        >
          <Store className="size-3.5 text-muted-foreground" />
          <span className="max-w-40 truncate">{currentBusiness.businessName}</span>
          {canSwitch && <ChevronsUpDown className="size-3 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('header.business_switch', 'Switch business')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onSelect={() => handleSelect(b.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2 truncate">
              <Store className="size-3.5 text-muted-foreground" />
              <span className="truncate">{b.businessName}</span>
            </span>
            {b.id === currentBusiness.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/business')}>
          <span className="flex items-center gap-2">
            <Globe2 className="size-3.5 text-muted-foreground" />
            {t('header.business_center', 'Business center')}
          </span>
        </DropdownMenuItem>
        {isSuperAdmin && (
          <DropdownMenuItem onSelect={() => navigate('/business?tab=businesses')}>
            <PlusCircle className="size-3.5 text-muted-foreground" />
            {t('business.new_business', 'New business')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}