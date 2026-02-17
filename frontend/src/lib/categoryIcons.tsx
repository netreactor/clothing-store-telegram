import { type LucideIcon, Shirt, Footprints, Dumbbell, Watch, Handbag, ShoppingBag, Sparkles, Gem, ShieldHalf, ScanFace, Crown, CircleHelp } from 'lucide-react';

export const CATEGORY_ICON_OPTIONS: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: 'shirt', label: 'Футболка', icon: Shirt },
  { value: 'footprints', label: 'Обувь', icon: Footprints },
  { value: 'dumbbell', label: 'Шорты / спорт', icon: Dumbbell },
  { value: 'watch', label: 'Часы', icon: Watch },
  { value: 'handbag', label: 'Сумки', icon: Handbag },
  { value: 'shopping-bag', label: 'Сумка / покупки', icon: ShoppingBag },
  { value: 'sparkles', label: 'Новинки', icon: Sparkles },
  { value: 'gem', label: 'Премиум', icon: Gem },
  { value: 'shield-half', label: 'Верхняя одежда', icon: ShieldHalf },
  { value: 'scan-face', label: 'Кепки / шапки', icon: ScanFace },
  { value: 'crown', label: 'Коллекция', icon: Crown },
];

export function getCategoryIcon(iconName?: string): LucideIcon {
  return CATEGORY_ICON_OPTIONS.find((icon) => icon.value === iconName)?.icon ?? CircleHelp;
}
