export interface StoreMenuItem {
  id: string;
  label: string;
  href: string;
  target: string;
  children: StoreMenuItem[];
}
