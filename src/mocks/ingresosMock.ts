export interface Ingreso {
  _id: string;
  name: string;
  category: string;
  detail: string;
  amount: number;
  date: string;
  paymethod: string;
}

export const INCOME_CATEGORIES = [
  "Salario",
  "Freelance",
  "Arriendo",
  "Inversiones",
  "Bonificación",
  "Venta",
  "Transferencia",
  "Otro",
] as const;

// Mock data — se reemplazará con llamada real al backend
export const INGRESOS_MOCK: Ingreso[] = [
  { _id: "i1",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 1",  amount: 2500000, date: "2026-04-01", paymethod: "Transferencia" },
  { _id: "i2",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 2",  amount: 2500000, date: "2026-04-15", paymethod: "Transferencia" },
  { _id: "i3",  name: "Proyecto web",    category: "Freelance",    detail: "Landing page cliente", amount: 800000, date: "2026-04-10", paymethod: "Nequi" },
  { _id: "i4",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 1",  amount: 2500000, date: "2026-03-01", paymethod: "Transferencia" },
  { _id: "i5",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 2",  amount: 2500000, date: "2026-03-15", paymethod: "Transferencia" },
  { _id: "i6",  name: "Consultoría",     category: "Freelance",    detail: "Asesoría técnica",    amount: 450000, date: "2026-03-20", paymethod: "Daviplata" },
  { _id: "i7",  name: "Dividendos",      category: "Inversiones",  detail: "Rendimiento CDT",     amount: 120000, date: "2026-03-31", paymethod: "Transferencia" },
  { _id: "i8",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 1",  amount: 2500000, date: "2026-02-01", paymethod: "Transferencia" },
  { _id: "i9",  name: "Salario",         category: "Salario",      detail: "Nómina quincena 2",  amount: 2500000, date: "2026-02-15", paymethod: "Transferencia" },
  { _id: "i10", name: "Bono desempeño",  category: "Bonificación", detail: "Q4 2025",             amount: 600000, date: "2026-02-28", paymethod: "Transferencia" },
  { _id: "i11", name: "Salario",         category: "Salario",      detail: "Nómina quincena 1",  amount: 2500000, date: "2026-01-01", paymethod: "Transferencia" },
  { _id: "i12", name: "Salario",         category: "Salario",      detail: "Nómina quincena 2",  amount: 2500000, date: "2026-01-15", paymethod: "Transferencia" },
  { _id: "i13", name: "Venta laptop",    category: "Venta",        detail: "MacBook Pro 2021",   amount: 3200000, date: "2026-01-08", paymethod: "Nequi" },
  { _id: "i14", name: "Proyecto app",    category: "Freelance",    detail: "App móvil cliente",   amount: 1200000, date: "2026-01-25", paymethod: "Transferencia" },
];
