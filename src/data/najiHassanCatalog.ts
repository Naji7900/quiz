/**
 * Naji Hassan Catalog - 584 items across 38 category pages
 * Extracted from attached master sheet: NAJI_HASSAN__cffd7227
 */
import { SparePartItem, generateSmartPartId } from './initialData';

export interface RawCatalogItem {
  name: string;
  cat: string;
  d: number;
  yuan: number;
  usd: number;
  salesPrice: number;
}

export const NAJI_HASSAN_DATA: RawCatalogItem[] = [
  {
    "name": "A025",
    "cat": "SAMSUNG / LCD",
    "d": 18.9,
    "yuan": 37.23,
    "usd": 5.15,
    "salesPrice": 5.7
  },
  {
    "name": "A03 CORE",
    "cat": "SAMSUNG / LCD",
    "d": 19.2,
    "yuan": 37.82,
    "usd": 5.23,
    "salesPrice": 5.7
  },
  {
    "name": "A047",
    "cat": "SAMSUNG / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 5.7
  },
  {
    "name": "A04E",
    "cat": "SAMSUNG / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 5.8
  },
  {
    "name": "A055",
    "cat": "SAMSUNG / LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.2
  },
  {
    "name": "A057",
    "cat": "SAMSUNG / LCD",
    "d": 22.5,
    "yuan": 44.33,
    "usd": 6.13,
    "salesPrice": 6.8
  },
  {
    "name": "A065",
    "cat": "SAMSUNG / LCD",
    "d": 21.5,
    "yuan": 42.36,
    "usd": 5.86,
    "salesPrice": 6.4
  },
  {
    "name": "A07",
    "cat": "SAMSUNG / LCD",
    "d": 22.8,
    "yuan": 44.92,
    "usd": 6.21,
    "salesPrice": 6.8
  },
  {
    "name": "A105",
    "cat": "SAMSUNG / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.5
  },
  {
    "name": "A107",
    "cat": "SAMSUNG / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.5
  },
  {
    "name": "A11",
    "cat": "SAMSUNG / LCD",
    "d": 20.8,
    "yuan": 40.98,
    "usd": 5.67,
    "salesPrice": 6.1
  },
  {
    "name": "A12",
    "cat": "SAMSUNG / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 5.7
  },
  {
    "name": "A135",
    "cat": "SAMSUNG / LCD",
    "d": 19.3,
    "yuan": 38.02,
    "usd": 5.26,
    "salesPrice": 5.9
  },
  {
    "name": "A145",
    "cat": "SAMSUNG / LCD",
    "d": 22.4,
    "yuan": 44.13,
    "usd": 6.1,
    "salesPrice": 6.4
  },
  {
    "name": "A146",
    "cat": "SAMSUNG / LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.4
  },
  {
    "name": "A15 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 37,
    "yuan": 72.89,
    "usd": 10.08,
    "salesPrice": 11.5
  },
  {
    "name": "A15 Orginal WF 4G",
    "cat": "SAMSUNG / LCD",
    "d": 120,
    "yuan": 236.4,
    "usd": 32.7,
    "salesPrice": 42
  },
  {
    "name": "A15 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 21.3,
    "yuan": 41.96,
    "usd": 5.8,
    "salesPrice": 6.6
  },
  {
    "name": "A16 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 40,
    "yuan": 78.8,
    "usd": 10.9,
    "salesPrice": 12.5
  },
  {
    "name": "A16 Orginal WF 4G",
    "cat": "SAMSUNG / LCD",
    "d": 144,
    "yuan": 283.68,
    "usd": 39.24,
    "salesPrice": 42
  },
  {
    "name": "A16 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 21.5,
    "yuan": 42.36,
    "usd": 5.86,
    "salesPrice": 6.6
  },
  {
    "name": "A17 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 42,
    "yuan": 82.74,
    "usd": 11.44,
    "salesPrice": 12.5
  },
  {
    "name": "A17 INCEL WF",
    "cat": "SAMSUNG / LCD",
    "d": 22,
    "yuan": 43.34,
    "usd": 5.99,
    "salesPrice": 7.3
  },
  {
    "name": "A17 NF",
    "cat": "SAMSUNG / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6.2
  },
  {
    "name": "A17 Orginal WF 4G",
    "cat": "SAMSUNG / LCD",
    "d": 127,
    "yuan": 250.19,
    "usd": 34.6,
    "salesPrice": 36
  },
  {
    "name": "A17 Orginal WF 5G",
    "cat": "SAMSUNG / LCD",
    "d": 123,
    "yuan": 242.31,
    "usd": 33.51,
    "salesPrice": 35
  },
  {
    "name": "A20  WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 5.9
  },
  {
    "name": "A207",
    "cat": "SAMSUNG / LCD",
    "d": 20.4,
    "yuan": 40.19,
    "usd": 5.56,
    "salesPrice": 6.2
  },
  {
    "name": "A217",
    "cat": "SAMSUNG / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 6.1
  },
  {
    "name": "A22 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 20.7,
    "yuan": 40.78,
    "usd": 5.64,
    "salesPrice": 6.5
  },
  {
    "name": "A235",
    "cat": "SAMSUNG / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 6.3
  },
  {
    "name": "A24 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 37,
    "yuan": 72.89,
    "usd": 10.08,
    "salesPrice": 11.5
  },
  {
    "name": "A24 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 23.8,
    "yuan": 46.89,
    "usd": 6.49,
    "salesPrice": 7.5
  },
  {
    "name": "A25 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 39,
    "yuan": 76.83,
    "usd": 10.63,
    "salesPrice": 11
  },
  {
    "name": "A25 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 23,
    "yuan": 45.31,
    "usd": 6.27,
    "salesPrice": 7.5
  },
  {
    "name": "A26 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 29,
    "yuan": 57.13,
    "usd": 7.9,
    "salesPrice": 9
  },
  {
    "name": "A30 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 21.5,
    "yuan": 42.36,
    "usd": 5.86,
    "salesPrice": 6.4
  },
  {
    "name": "A307 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6
  },
  {
    "name": "A31 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 6.4
  },
  {
    "name": "A32 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 21.3,
    "yuan": 41.96,
    "usd": 5.8,
    "salesPrice": 6.6
  },
  {
    "name": "A33 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 27.8,
    "yuan": 54.77,
    "usd": 7.57,
    "salesPrice": 8.5
  },
  {
    "name": "A34 BRAND WF",
    "cat": "SAMSUNG / LCD",
    "d": 41,
    "yuan": 80.77,
    "usd": 11.17,
    "salesPrice": 12.5
  },
  {
    "name": "A34 WF BRAND",
    "cat": "SAMSUNG / LCD",
    "d": 27.6,
    "yuan": 54.37,
    "usd": 7.52,
    "salesPrice": 8.5
  },
  {
    "name": "A35 5G WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 30.2,
    "yuan": 59.49,
    "usd": 8.23,
    "salesPrice": 9.5
  },
  {
    "name": "A36 5G WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 33,
    "yuan": 65.01,
    "usd": 8.99,
    "salesPrice": 10
  },
  {
    "name": "A51 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 21.2,
    "yuan": 41.76,
    "usd": 5.78,
    "salesPrice": 6.6
  },
  {
    "name": "A52 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 26.2,
    "yuan": 51.61,
    "usd": 7.14,
    "salesPrice": 8
  },
  {
    "name": "A53 WF INCEL 5G",
    "cat": "SAMSUNG / LCD",
    "d": 27.2,
    "yuan": 53.58,
    "usd": 7.41,
    "salesPrice": 8.5
  },
  {
    "name": "A54 WF INCEL  5G",
    "cat": "SAMSUNG / LCD",
    "d": 31.5,
    "yuan": 62.06,
    "usd": 8.58,
    "salesPrice": 9.5
  },
  {
    "name": "A55 WF INCEL 5G",
    "cat": "SAMSUNG / LCD",
    "d": 31.5,
    "yuan": 62.06,
    "usd": 8.58,
    "salesPrice": 9.5
  },
  {
    "name": "A56 WF INCEL 5G",
    "cat": "SAMSUNG / LCD",
    "d": 37,
    "yuan": 72.89,
    "usd": 10.08,
    "salesPrice": 11.5
  },
  {
    "name": "A6 + NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6
  },
  {
    "name": "A70  WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 22,
    "yuan": 43.34,
    "usd": 5.99,
    "salesPrice": 7
  },
  {
    "name": "A71 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 22,
    "yuan": 43.34,
    "usd": 5.99,
    "salesPrice": 7
  },
  {
    "name": "A72 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 28,
    "yuan": 55.16,
    "usd": 7.63,
    "salesPrice": 8.5
  },
  {
    "name": "A73 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 29.5,
    "yuan": 58.12,
    "usd": 8.04,
    "salesPrice": 9
  },
  {
    "name": "A750 NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 7
  },
  {
    "name": "BACKGLASS  11",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.73,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  11 PRO",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  11 PRO MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  12",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.73,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  12 PRO",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  12 PRO MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  13",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.73,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  13 PRO MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  14",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.73,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  14 PRO",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  14 PRO MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  15",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  15 PRO",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  16 PRO MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 1.3,
    "salesPrice": 1.5
  },
  {
    "name": "BACKGLASS  8+",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.63,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  XR",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.55,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  XS",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.65,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  XS MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.75,
    "salesPrice": 1
  },
  {
    "name": "BACKGLASS  XS MAX",
    "cat": "IPHONE / BACK GLASS",
    "d": 0,
    "yuan": 0,
    "usd": 0.75,
    "salesPrice": 0.75
  },
  {
    "name": "BATERRY IP 14",
    "cat": "IPhone / BATTERY",
    "d": 13.5,
    "yuan": 26.6,
    "usd": 3.68,
    "salesPrice": 4
  },
  {
    "name": "BATTERY A025",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A025",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A04",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A04",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A05",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A05",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A057",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A057",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A06",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 0,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A06",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 0,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A10",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A10",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A107",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A107",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A12",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A12",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A13",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A13",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A146B",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A146B",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A15",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A15",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A16",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A16",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A17",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A17",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A20",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A20",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A26",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A26",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A31",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A31",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A34",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A34",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A51",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A51",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A56",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A56",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY A70",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY A70",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY HUAWIE Y7 2019",
    "cat": "HUAWIE/ BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.94,
    "salesPrice": 3
  },
  {
    "name": "HUAWIE Y9 prime 2019",
    "cat": "HUAWIE / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 6
  },
  {
    "name": "BATTERY INFINIX SAMART 10",
    "cat": "INFINIX / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 2.15,
    "salesPrice": 3
  },
  {
    "name": "BATTERY INFINIX SAMART 8",
    "cat": "INFINIX/ BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.86,
    "salesPrice": 3
  },
  {
    "name": "BATTERY INFINIX SAMART 9",
    "cat": "INFINIX/ BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.94,
    "salesPrice": 3
  },
  {
    "name": "BATTERY IP 11 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 16.8,
    "yuan": 33.1,
    "usd": 4.58,
    "salesPrice": 5
  },
  {
    "name": "BATTERY IP 11 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 16.8,
    "yuan": 33.1,
    "usd": 4.58,
    "salesPrice": 5
  },
  {
    "name": "BATTERY IP 12 PRO",
    "cat": "IPhone / BATTERY",
    "d": 11,
    "yuan": 21.67,
    "usd": 3,
    "salesPrice": 4.5
  },
  {
    "name": "BATTERY IP 12 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 15.2,
    "yuan": 29.94,
    "usd": 4.14,
    "salesPrice": 5
  },
  {
    "name": "BATTERY IP 13",
    "cat": "IPhone / BATTERY",
    "d": 13,
    "yuan": 25.61,
    "usd": 3.54,
    "salesPrice": 4
  },
  {
    "name": "BATTERY IP 13 PRO",
    "cat": "IPhone / BATTERY",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 5
  },
  {
    "name": "BATTERY IP 14 PRO",
    "cat": "IPhone / BATTERY",
    "d": 16.2,
    "yuan": 31.91,
    "usd": 4.41,
    "salesPrice": 5
  },
  {
    "name": "BATTERY IP 14 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 5.5
  },
  {
    "name": "BATTERY IP 15 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 5.5
  },
  {
    "name": "BATTERY IP 16 PRO MAX",
    "cat": "IPhone / BATTERY",
    "d": 27,
    "yuan": 53.19,
    "usd": 7.36,
    "salesPrice": 8.5
  },
  {
    "name": "BATTERY IP 6+",
    "cat": "IPhone / BATTERY",
    "d": 7.7,
    "yuan": 15.17,
    "usd": 2.1,
    "salesPrice": 2.5
  },
  {
    "name": "BATTERY IP 6S",
    "cat": "IPhone / BATTERY",
    "d": 7.7,
    "yuan": 15.17,
    "usd": 2.1,
    "salesPrice": 2.5
  },
  {
    "name": "IP 7 +",
    "cat": "IPhone / LCD",
    "d": 17.8,
    "yuan": 35.07,
    "usd": 4.85,
    "salesPrice": 6
  },
  {
    "name": "BATTERY IP 7 G",
    "cat": "IPhone / BATTERY",
    "d": 7.5,
    "yuan": 14.78,
    "usd": 2.04,
    "salesPrice": 2.5
  },
  {
    "name": "BATTERY IP 8 +",
    "cat": "IPhone / BATTERY",
    "d": 7.7,
    "yuan": 15.17,
    "usd": 2.1,
    "salesPrice": 2.5
  },
  {
    "name": "BATTERY IP 8 G",
    "cat": "IPhone / BATTERY",
    "d": 7.7,
    "yuan": 15.17,
    "usd": 2.1,
    "salesPrice": 2.5
  },
  {
    "name": "BATTERY IP Xr",
    "cat": "IPhone / BATTERY",
    "d": 9.8,
    "yuan": 19.31,
    "usd": 2.67,
    "salesPrice": 3.5
  },
  {
    "name": "BATTERY IP Xr",
    "cat": "IPhone / BATTERY",
    "d": 9.8,
    "yuan": 19.31,
    "usd": 2.67,
    "salesPrice": 2.67
  },
  {
    "name": "BATTERY IP Xs maX",
    "cat": "IPhone / BATTERY",
    "d": 12.2,
    "yuan": 24.03,
    "usd": 3.32,
    "salesPrice": 3.5
  },
  {
    "name": "BATTERY IP Xs maX",
    "cat": "IPhone / BATTERY",
    "d": 11.5,
    "yuan": 22.66,
    "usd": 3.13,
    "salesPrice": 3.5
  },
  {
    "name": "BATTERY M13",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY M13",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY M32",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 2.3
  },
  {
    "name": "BATTERY M32",
    "cat": "SAMSUNG / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.8,
    "salesPrice": 1.8
  },
  {
    "name": "BATTERY REDMI 10",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.86,
    "salesPrice": 3
  },
  {
    "name": "BATTERY REDMI 12",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 2.15,
    "salesPrice": 3
  },
  {
    "name": "BATTERY REDMI 13C",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 1.86,
    "salesPrice": 3
  },
  {
    "name": "BATTERY REDMI 13C",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 13.8,
    "usd": 1,
    "salesPrice": 1.3
  },
  {
    "name": "BATTERY REDMI 13C",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 13.8,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "BATTERY REDMI 14C",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 13.8,
    "usd": 2.03,
    "salesPrice": 1.3
  },
  {
    "name": "Redmi 9",
    "cat": "REDMI / LCD",
    "d": 16.3,
    "yuan": 32.11,
    "usd": 4.44,
    "salesPrice": 6
  },
  {
    "name": "BATTERY REDMI 9T",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 13.5,
    "usd": 2.15,
    "salesPrice": 3
  },
  {
    "name": "Redmi Note 10 5G",
    "cat": "REDMI / LCD",
    "d": 18.9,
    "yuan": 37.23,
    "usd": 5.15,
    "salesPrice": 6.5
  },
  {
    "name": "BATTERY REDMI NOTE 10 PRO",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 0,
    "usd": 5.32,
    "salesPrice": 5.5
  },
  {
    "name": "BATTERY REDMI NOTE 12",
    "cat": "REDMI / BATTERY",
    "d": 0,
    "yuan": 12,
    "usd": 2.15,
    "salesPrice": 3
  },
  {
    "name": "BIRTA SWICH  15",
    "cat": "SAMSUNG / BIRTAA",
    "d": 0,
    "yuan": 0,
    "usd": 0.25,
    "salesPrice": 0.35
  },
  {
    "name": "BIRTA SWICH  15",
    "cat": "SAMSUNG / BIRTAA",
    "d": 0,
    "yuan": 0,
    "usd": 0.25,
    "salesPrice": 0.25
  },
  {
    "name": "BIRTA SWICH  A12",
    "cat": "SAMSUNG / BIRTAA",
    "d": 0,
    "yuan": 0,
    "usd": 0.25,
    "salesPrice": 0.35
  },
  {
    "name": "BIRTA SWICH  A12",
    "cat": "SAMSUNG / BIRTAA",
    "d": 0,
    "yuan": 0,
    "usd": 0.25,
    "salesPrice": 0.25
  },
  {
    "name": "BMB 15 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "BMB 230",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "BMB 310 17PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "BMB 330 37PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "BMB 3310",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "CIRBADDA",
    "cat": "TOOL",
    "d": 0,
    "yuan": 0,
    "usd": 1.38,
    "salesPrice": 2.5
  },
  {
    "name": "COVER  A022",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "COVER  A03",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER  A10",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "COVER A025",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.3
  },
  {
    "name": "COVER A025",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "COVER A03 CORE",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A047",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A04E",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A05",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A057",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A06",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A07",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A107",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A11",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A12",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A13 4G",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A14 4G",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A145P",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "COVER A15 4G",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A16 4G",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.5
  },
  {
    "name": "COVER A2 CORE",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "COVER A217",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER A32 4G",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2.4
  },
  {
    "name": "COVER M12",
    "cat": "SAMSUNG / COVER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "DD  14 PRO MaX",
    "cat": "IPhone / LCD",
    "d": 121,
    "yuan": 238.37,
    "usd": 32.97,
    "salesPrice": 35
  },
  {
    "name": "DD  15",
    "cat": "IPhone / LCD",
    "d": 131,
    "yuan": 258.07,
    "usd": 35.69,
    "salesPrice": 45
  },
  {
    "name": "DD  15 PRO MaX",
    "cat": "IPhone / LCD",
    "d": 121,
    "yuan": 238.37,
    "usd": 32.97,
    "salesPrice": 35
  },
  {
    "name": "DD  16 PRO MaX",
    "cat": "IPhone / LCD",
    "d": 204,
    "yuan": 401.89,
    "usd": 55.59,
    "salesPrice": 58.5
  },
  {
    "name": "DD  17 PRO",
    "cat": "IPhone / LCD",
    "d": 154,
    "yuan": 303.38,
    "usd": 41.96,
    "salesPrice": 45
  },
  {
    "name": "DD  17 PRO MaX",
    "cat": "IPhone / LCD",
    "d": 238,
    "yuan": 468.87,
    "usd": 64.85,
    "salesPrice": 69
  },
  {
    "name": "DD 13 PRO",
    "cat": "IPhone / LCD",
    "d": 117,
    "yuan": 230.49,
    "usd": 31.88,
    "salesPrice": 34
  },
  {
    "name": "DD 13 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 115,
    "yuan": 226.55,
    "usd": 31.34,
    "salesPrice": 33.5
  },
  {
    "name": "FINGER  A037",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1.23,
    "salesPrice": 1.5
  },
  {
    "name": "FINGER  A057",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.3
  },
  {
    "name": "FINGER  A057",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "FINGER  A12",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.4
  },
  {
    "name": "FINGER  A14",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "FINGER  A15",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 0.28,
    "salesPrice": 0.4
  },
  {
    "name": "FINGER  A15",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 0.28,
    "salesPrice": 0.28
  },
  {
    "name": "FINGER  A16",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1.42,
    "salesPrice": 1.5
  },
  {
    "name": "FINGER  A23",
    "cat": "SAMSUNG / FINGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.4
  },
  {
    "name": "FLASH 13 PRO MAX",
    "cat": "IPHONE / FLASH",
    "d": 0,
    "yuan": 0,
    "usd": 1.65,
    "salesPrice": 3
  },
  {
    "name": "FLASH 13 PRO MAX",
    "cat": "IPHONE / FLASH",
    "d": 0,
    "yuan": 0,
    "usd": 3.31,
    "salesPrice": 4
  },
  {
    "name": "FLASH 14 PRO MAX",
    "cat": "IPHONE / FLASH",
    "d": 0,
    "yuan": 0,
    "usd": 2.85,
    "salesPrice": 3.5
  },
  {
    "name": "FLEX CABLE  A15",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A16",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A17",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A22",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A31",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A32",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A34",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A50",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A51",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A52",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A53",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A55",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CABLE  A71",
    "cat": "SAMSUNG / FLEX CABLE",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER 13C",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.65,
    "usd": 0.54,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER 14C",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.65,
    "usd": 0.54,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER 15C",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.95,
    "usd": 0.58,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER 6515",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 3.65,
    "usd": 0.54,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER 9C",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.1,
    "usd": 0.46,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER 9T",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.2,
    "usd": 0.47,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER A02",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A025",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A03",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A03 CORE",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A04",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A047",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A04E",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A05",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A057",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A06",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A10",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A107",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A107 M15",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A107 M16",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A11",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A12",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A13",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A145P",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A146B",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A15",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A16",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A17",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A20",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A207 M12",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A207 M14",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A22",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A22 5G",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A23",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.4
  },
  {
    "name": "FLEX CHARGER A24",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A25",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A26",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A30",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A307",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A31",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A32 4G",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A32 5G",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A33",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "FLEX CHARGER A34",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "FLEX CHARGER A35",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "FLEX CHARGER A37",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2
  },
  {
    "name": "FLEX CHARGER A5",
    "cat": "FLEX CHARGER REDMI",
    "d": 0,
    "yuan": 3.75,
    "usd": 0.55,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER A51",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER A52",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 4.5
  },
  {
    "name": "FLEX CHARGER A55",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1
  },
  {
    "name": "FLEX CHARGER A56",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2
  },
  {
    "name": "FLEX CHARGER A57",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2
  },
  {
    "name": "FLEX CHARGER A70",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 2
  },
  {
    "name": "FLEX CHARGER A72",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 4
  },
  {
    "name": "FLEX CHARGER A73",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 3.6
  },
  {
    "name": "FLEX CHARGER M13",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER M32 4G",
    "cat": "SAMSUNG / FLEX CHARGER",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.7
  },
  {
    "name": "FLEX CHARGER NOTE 10",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 3.65,
    "usd": 0.54,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER SMART 10",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER SMART 10",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.71
  },
  {
    "name": "FLEX CHARGER SMART 8",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER SMART 8",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.71
  },
  {
    "name": "FLEX CHARGER SMART 9",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER SMART 9",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.71
  },
  {
    "name": "FLEX CHARGER X6517",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 3.65,
    "usd": 0.54,
    "salesPrice": 0.9
  },
  {
    "name": "FLEX CHARGER X6525",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 4.85,
    "usd": 0.71,
    "salesPrice": 0.8
  },
  {
    "name": "FLEX CHARGER X699",
    "cat": "FLEX CHARGER / INFINIX",
    "d": 0,
    "yuan": 3.55,
    "usd": 0.52,
    "salesPrice": 0.9
  },
  {
    "name": "GX 11",
    "cat": "IPhone / LCD",
    "d": 23.8,
    "yuan": 46.89,
    "usd": 6.49,
    "salesPrice": 7.2
  },
  {
    "name": "GX 11 PRO",
    "cat": "IPhone / LCD",
    "d": 68.5,
    "yuan": 134.95,
    "usd": 18.66,
    "salesPrice": 21
  },
  {
    "name": "GX 11 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 81,
    "yuan": 159.57,
    "usd": 22.07,
    "salesPrice": 23
  },
  {
    "name": "GX 12 PRO / 12",
    "cat": "IPhone / LCD",
    "d": 76.5,
    "yuan": 150.71,
    "usd": 20.84,
    "salesPrice": 22.5
  },
  {
    "name": "GX 12 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 105,
    "yuan": 206.85,
    "usd": 28.61,
    "salesPrice": 30.5
  },
  {
    "name": "GX 13",
    "cat": "IPhone / LCD",
    "d": 89,
    "yuan": 175.33,
    "usd": 24.25,
    "salesPrice": 27
  },
  {
    "name": "GX 13 PRO",
    "cat": "IPhone / LCD",
    "d": 96,
    "yuan": 189.12,
    "usd": 26.16,
    "salesPrice": 27.5
  },
  {
    "name": "GX 13 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 103,
    "yuan": 202.91,
    "usd": 28.07,
    "salesPrice": 30.5
  },
  {
    "name": "GX 14",
    "cat": "IPhone / LCD",
    "d": 92,
    "yuan": 181.24,
    "usd": 25.07,
    "salesPrice": 29
  },
  {
    "name": "GX 14 PRO",
    "cat": "IPhone / LCD",
    "d": 97,
    "yuan": 191.09,
    "usd": 26.43,
    "salesPrice": 29
  },
  {
    "name": "GX 14 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 97,
    "yuan": 191.09,
    "usd": 26.43,
    "salesPrice": 30
  },
  {
    "name": "GX 15",
    "cat": "IPhone / LCD",
    "d": 97,
    "yuan": 191.09,
    "usd": 26.43,
    "salesPrice": 29
  },
  {
    "name": "GX 15 PRO",
    "cat": "IPhone / LCD",
    "d": 94,
    "yuan": 185.18,
    "usd": 25.61,
    "salesPrice": 29
  },
  {
    "name": "GX 15 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 97,
    "yuan": 191.09,
    "usd": 26.43,
    "salesPrice": 30
  },
  {
    "name": "GX 16 PRO MaX",
    "cat": "IPhone / LCD",
    "d": 134,
    "yuan": 263.98,
    "usd": 36.51,
    "salesPrice": 40
  },
  {
    "name": "GX XR",
    "cat": "IPhone / LCD",
    "d": 23.8,
    "yuan": 46.89,
    "usd": 6.49,
    "salesPrice": 7.2
  },
  {
    "name": "GX XS",
    "cat": "IPhone / LCD",
    "d": 58.5,
    "yuan": 115.25,
    "usd": 15.94,
    "salesPrice": 17.5
  },
  {
    "name": "GX XS MaX",
    "cat": "IPhone / LCD",
    "d": 78,
    "yuan": 153.66,
    "usd": 21.25,
    "salesPrice": 22.5
  },
  {
    "name": "HONOR 50 LITE 4G / NOVA 8I",
    "cat": "HONOR / LCD",
    "d": 20,
    "yuan": 39.4,
    "usd": 5.45,
    "salesPrice": 6
  },
  {
    "name": "HONOR X5c",
    "cat": "HONOR / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 6
  },
  {
    "name": "HONOR X6 5G",
    "cat": "HONOR / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 6
  },
  {
    "name": "HONOR X6A",
    "cat": "HONOR / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 6
  },
  {
    "name": "HONOR X6B",
    "cat": "HONOR / LCD",
    "d": 16.3,
    "yuan": 32.11,
    "usd": 4.44,
    "salesPrice": 6
  },
  {
    "name": "HONOR X6C",
    "cat": "HONOR / LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 6
  },
  {
    "name": "HONOR X7",
    "cat": "HONOR / LCD",
    "d": 17.2,
    "yuan": 33.88,
    "usd": 4.69,
    "salesPrice": 6
  },
  {
    "name": "HONOR X7A",
    "cat": "HONOR / LCD",
    "d": 17.4,
    "yuan": 34.28,
    "usd": 4.74,
    "salesPrice": 6
  },
  {
    "name": "HONOR X7B",
    "cat": "HONOR / LCD",
    "d": 21.5,
    "yuan": 42.36,
    "usd": 5.86,
    "salesPrice": 6.5
  },
  {
    "name": "HONOR X7C",
    "cat": "HONOR / LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 6
  },
  {
    "name": "HONOR X8A / 90 lite",
    "cat": "HONOR / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6.5
  },
  {
    "name": "HONOR X8A / 90 lite",
    "cat": "HONOR / LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 6
  },
  {
    "name": "HORMUUD 18 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6,
    "usd": 0.88,
    "salesPrice": 1.1
  },
  {
    "name": "HORMUUD 18 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6,
    "usd": 0.88,
    "salesPrice": 0.88
  },
  {
    "name": "HUAWIE P SMART 2019",
    "cat": "HUAWIE / LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 5.8
  },
  {
    "name": "HUAWIE P20 Lite",
    "cat": "HUAWIE / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.8
  },
  {
    "name": "HUAWIE P30 Lite",
    "cat": "HUAWIE / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 6
  },
  {
    "name": "HUAWIE P40 Lite",
    "cat": "HUAWIE / LCD",
    "d": 17.6,
    "yuan": 34.67,
    "usd": 4.8,
    "salesPrice": 6
  },
  {
    "name": "HUAWIE Y6 2019",
    "cat": "HUAWIE / LCD",
    "d": 15.3,
    "yuan": 30.14,
    "usd": 4.17,
    "salesPrice": 5.5
  },
  {
    "name": "HUAWIE Y70",
    "cat": "HUAWIE / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.8
  },
  {
    "name": "HUAWIE y7A 2020",
    "cat": "HUAWIE / LCD",
    "d": 16.8,
    "yuan": 33.1,
    "usd": 4.58,
    "salesPrice": 6
  },
  {
    "name": "HUAWIE Y9 2019",
    "cat": "HUAWIE / LCD",
    "d": 17.2,
    "yuan": 33.88,
    "usd": 4.69,
    "salesPrice": 5.8
  },
  {
    "name": "HUAWIE Y9 prime 2019",
    "cat": "HUAWIE / LCD",
    "d": 16.7,
    "yuan": 32.9,
    "usd": 4.55,
    "salesPrice": 5.8
  },
  {
    "name": "HUAWIE Y9A",
    "cat": "HUAWIE / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.8
  },
  {
    "name": "INFINIX Bg6",
    "cat": "INFINIX /  LCD",
    "d": 16.8,
    "yuan": 33.1,
    "usd": 4.58,
    "salesPrice": 5.4
  },
  {
    "name": "INFINIX KM7, SPARK 40 PRO , HOT 60 PRO +",
    "cat": "INFINIX /  LCD",
    "d": 27.5,
    "yuan": 54.18,
    "usd": 7.49,
    "salesPrice": 10
  },
  {
    "name": "INFINIX SMART 20 / KN8 / SPARK 50",
    "cat": "INFINIX /  LCD",
    "d": 20.3,
    "yuan": 39.99,
    "usd": 5.53,
    "salesPrice": 6.5
  },
  {
    "name": "INFINIX X612",
    "cat": "INFINIX /  LCD",
    "d": 17.25,
    "yuan": 33.98,
    "usd": 4.7,
    "salesPrice": 5.5
  },
  {
    "name": "INFINIX X650",
    "cat": "INFINIX /  LCD",
    "d": 14.4,
    "yuan": 28.37,
    "usd": 3.92,
    "salesPrice": 5.5
  },
  {
    "name": "INFINIX X6517 , SMart 7",
    "cat": "INFINIX /  LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 5.2
  },
  {
    "name": "INFINIX X6525 , Smart 8 , bg6",
    "cat": "INFINIX /  LCD",
    "d": 16.8,
    "yuan": 33.1,
    "usd": 4.58,
    "salesPrice": 5.4
  },
  {
    "name": "INFINIX X657 , SMART 5",
    "cat": "INFINIX /  LCD",
    "d": 15.2,
    "yuan": 29.94,
    "usd": 4.14,
    "salesPrice": 5.8
  },
  {
    "name": "INFINIX X663",
    "cat": "INFINIX /  LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 5.7
  },
  {
    "name": "INFINIX X665 , Hot 12i , Smart 6",
    "cat": "INFINIX /  LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 5.5
  },
  {
    "name": "INFINIX X6720 , Smart 9",
    "cat": "INFINIX /  LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 5.4
  },
  {
    "name": "INFINIX X6725 , SMART 10",
    "cat": "INFINIX /  LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 5.7
  },
  {
    "name": "INFINIX X680",
    "cat": "INFINIX /  LCD",
    "d": 17.9,
    "yuan": 35.26,
    "usd": 4.88,
    "salesPrice": 6
  },
  {
    "name": "INFINIX X682",
    "cat": "INFINIX /  LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6
  },
  {
    "name": "INFINIX X688",
    "cat": "INFINIX /  LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 6
  },
  {
    "name": "INFINIX X689",
    "cat": "INFINIX /  LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 6
  },
  {
    "name": "INFINIX X693",
    "cat": "INFINIX /  LCD",
    "d": 17.8,
    "yuan": 35.07,
    "usd": 4.85,
    "salesPrice": 6
  },
  {
    "name": "IP 7 +",
    "cat": "IPhone / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 5.4
  },
  {
    "name": "IP 7 G",
    "cat": "IPhone / LCD",
    "d": 16.2,
    "yuan": 31.91,
    "usd": 4.41,
    "salesPrice": 5.4
  },
  {
    "name": "IP 8 +",
    "cat": "IPhone / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 5.4
  },
  {
    "name": "IP 8 G",
    "cat": "IPhone / LCD",
    "d": 16.2,
    "yuan": 31.91,
    "usd": 4.41,
    "salesPrice": 5.4
  },
  {
    "name": "ITEL A60",
    "cat": "ITEL /  LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 5.5
  },
  {
    "name": "J4 +",
    "cat": "SAMSUNG / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 5.9
  },
  {
    "name": "J6 NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 5.5
  },
  {
    "name": "J8 NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 5.5
  },
  {
    "name": "JH 11 PRO",
    "cat": "IPhone / LCD",
    "d": 44,
    "yuan": 86.68,
    "usd": 11.99,
    "salesPrice": 13.5
  },
  {
    "name": "JH 11 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 47.5,
    "yuan": 93.58,
    "usd": 12.94,
    "salesPrice": 14.5
  },
  {
    "name": "JH 12 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 62.5,
    "yuan": 123.13,
    "usd": 17.03,
    "salesPrice": 19
  },
  {
    "name": "JH 13 PRO",
    "cat": "IPhone / LCD",
    "d": 52,
    "yuan": 102.44,
    "usd": 14.17,
    "salesPrice": 16
  },
  {
    "name": "JH 13 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 58,
    "yuan": 114.26,
    "usd": 15.8,
    "salesPrice": 18
  },
  {
    "name": "JH 14 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 68,
    "yuan": 133.96,
    "usd": 18.53,
    "salesPrice": 21
  },
  {
    "name": "JH 16 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 99,
    "yuan": 195.03,
    "usd": 26.98,
    "salesPrice": 29
  },
  {
    "name": "JH XS MAX",
    "cat": "IPhone / LCD",
    "d": 44.5,
    "yuan": 87.67,
    "usd": 12.13,
    "salesPrice": 13.5
  },
  {
    "name": "M127",
    "cat": "SAMSUNG / LCD",
    "d": 20,
    "yuan": 39.4,
    "usd": 5.45,
    "salesPrice": 6.1
  },
  {
    "name": "M15  NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6.3
  },
  {
    "name": "M15 WF INCELL",
    "cat": "SAMSUNG / LCD",
    "d": 23.7,
    "yuan": 46.69,
    "usd": 6.46,
    "salesPrice": 7.3
  },
  {
    "name": "M16 4G NF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6.3
  },
  {
    "name": "M16 4G WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 22.8,
    "yuan": 44.92,
    "usd": 6.21,
    "salesPrice": 7.3
  },
  {
    "name": "M22 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 22.5,
    "yuan": 44.33,
    "usd": 6.13,
    "salesPrice": 7
  },
  {
    "name": "M30  WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 6
  },
  {
    "name": "M32 WF INCEL",
    "cat": "SAMSUNG / LCD",
    "d": 22.8,
    "yuan": 44.92,
    "usd": 6.21,
    "salesPrice": 7.5
  },
  {
    "name": "M336",
    "cat": "SAMSUNG / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 6.3
  },
  {
    "name": "MIC CHINES",
    "cat": "TOOL",
    "d": 0,
    "yuan": 0,
    "usd": 2,
    "salesPrice": 2.2
  },
  {
    "name": "MINI HUFAR 898",
    "cat": "HUFAR",
    "d": 90,
    "yuan": 177.3,
    "usd": 24.52,
    "salesPrice": 29
  },
  {
    "name": "MOTOROLA E13",
    "cat": "MOTOROLA / LCD",
    "d": 17.2,
    "yuan": 33.88,
    "usd": 4.69,
    "salesPrice": 6
  },
  {
    "name": "MOTOROLA e15",
    "cat": "MOTOROLA / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA E20",
    "cat": "MOTOROLA / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA e22",
    "cat": "MOTOROLA / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA E40",
    "cat": "MOTOROLA / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA e7 I power",
    "cat": "MOTOROLA / LCD",
    "d": 17.7,
    "yuan": 34.87,
    "usd": 4.82,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G PLAY",
    "cat": "MOTOROLA / LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G pure",
    "cat": "MOTOROLA / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G06",
    "cat": "MOTOROLA / LCD",
    "d": 20.7,
    "yuan": 40.78,
    "usd": 5.64,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G22",
    "cat": "MOTOROLA / LCD",
    "d": 18,
    "yuan": 35.46,
    "usd": 4.9,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G23 , G13",
    "cat": "MOTOROLA / LCD",
    "d": 18,
    "yuan": 35.46,
    "usd": 4.9,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G24",
    "cat": "MOTOROLA / LCD",
    "d": 17.8,
    "yuan": 35.07,
    "usd": 4.85,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G30",
    "cat": "MOTOROLA / LCD",
    "d": 17.4,
    "yuan": 34.28,
    "usd": 4.74,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G31",
    "cat": "MOTOROLA / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G32",
    "cat": "MOTOROLA / LCD",
    "d": 20.7,
    "yuan": 40.78,
    "usd": 5.64,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G34",
    "cat": "MOTOROLA / LCD",
    "d": 19.3,
    "yuan": 38.02,
    "usd": 5.26,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G40",
    "cat": "MOTOROLA / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G53",
    "cat": "MOTOROLA / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G54",
    "cat": "MOTOROLA / LCD",
    "d": 22,
    "yuan": 43.34,
    "usd": 5.99,
    "salesPrice": 7
  },
  {
    "name": "MOTOROLA G64",
    "cat": "MOTOROLA / LCD",
    "d": 20.7,
    "yuan": 40.78,
    "usd": 5.64,
    "salesPrice": 6.5
  },
  {
    "name": "MOTOROLA G8 POWER",
    "cat": "MOTOROLA / LCD",
    "d": 23.2,
    "yuan": 45.7,
    "usd": 6.32,
    "salesPrice": 7
  },
  {
    "name": "MOTOROLA G84",
    "cat": "MOTOROLA / LCD",
    "d": 23.5,
    "yuan": 46.3,
    "usd": 6.4,
    "salesPrice": 7
  },
  {
    "name": "Oppo A15 2020",
    "cat": "OPPO / LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A15 2020",
    "cat": "OPPO / LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 4.22
  },
  {
    "name": "Oppo A16 2020",
    "cat": "OPPO / LCD",
    "d": 15.8,
    "yuan": 31.13,
    "usd": 4.31,
    "salesPrice": 5.5
  },
  {
    "name": "oppo A17",
    "cat": "OPPO / LCD",
    "d": 16.6,
    "yuan": 32.7,
    "usd": 4.52,
    "salesPrice": 5.3
  },
  {
    "name": "oppo A1K",
    "cat": "OPPO / LCD",
    "d": 15.3,
    "yuan": 30.14,
    "usd": 4.17,
    "salesPrice": 5.5
  },
  {
    "name": "oppo a52 4g 2020",
    "cat": "OPPO / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 5.5
  },
  {
    "name": "oppo A53",
    "cat": "OPPO / LCD",
    "d": 15.8,
    "yuan": 31.13,
    "usd": 4.31,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A54 4G",
    "cat": "OPPO / LCD",
    "d": 15.7,
    "yuan": 30.93,
    "usd": 4.28,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A54 5G",
    "cat": "OPPO / LCD",
    "d": 19.3,
    "yuan": 38.02,
    "usd": 5.26,
    "salesPrice": 6
  },
  {
    "name": "oppo a76",
    "cat": "OPPO / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.5
  },
  {
    "name": "oppo a78 , reno 8",
    "cat": "OPPO / LCD",
    "d": 19.2,
    "yuan": 37.82,
    "usd": 5.23,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A9 2020 / A31",
    "cat": "OPPO / LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A9 2020 / A31",
    "cat": "OPPO / LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 4.22
  },
  {
    "name": "Oppo A93 4G",
    "cat": "OPPO / LCD",
    "d": 22,
    "yuan": 43.34,
    "usd": 5.99,
    "salesPrice": 7
  },
  {
    "name": "Oppo A94 4G",
    "cat": "OPPO / LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 5.5
  },
  {
    "name": "Oppo A96",
    "cat": "OPPO / LCD",
    "d": 19.2,
    "yuan": 37.82,
    "usd": 5.23,
    "salesPrice": 6
  },
  {
    "name": "Oppo A98 5G , Realme c55",
    "cat": "OPPO / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6
  },
  {
    "name": "oppo F11",
    "cat": "OPPO / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 5.5
  },
  {
    "name": "oppo F11 PRO",
    "cat": "OPPO / LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.5
  },
  {
    "name": "OPPO F15",
    "cat": "OPPO / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 6
  },
  {
    "name": "Oppo Reno 5",
    "cat": "OPPO / LCD",
    "d": 19.6,
    "yuan": 38.61,
    "usd": 5.34,
    "salesPrice": 6
  },
  {
    "name": "PASSWORD BY PASS WEYN",
    "cat": "TOOL",
    "d": 0,
    "yuan": 0,
    "usd": 7.7,
    "salesPrice": 13
  },
  {
    "name": "PASSWORD BY PASS YAR",
    "cat": "TOOL",
    "d": 0,
    "yuan": 0,
    "usd": 6.3,
    "salesPrice": 12
  },
  {
    "name": "RAYAN 20 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "RAYAN POWER 16 PIN WAWEYN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6.8,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "REALME9 PRO , 1+",
    "cat": "REALME / LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.5
  },
  {
    "name": "REALMEC21",
    "cat": "REALME / LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 6
  },
  {
    "name": "REALMEC21Y",
    "cat": "REALME / LCD",
    "d": 16.1,
    "yuan": 31.72,
    "usd": 4.39,
    "salesPrice": 6
  },
  {
    "name": "REALMEC30",
    "cat": "REALME / LCD",
    "d": 16.2,
    "yuan": 31.91,
    "usd": 4.41,
    "salesPrice": 6
  },
  {
    "name": "REALMEC35",
    "cat": "REALME / LCD",
    "d": 15.4,
    "yuan": 30.34,
    "usd": 4.2,
    "salesPrice": 6
  },
  {
    "name": "REALMEC53",
    "cat": "REALME / LCD",
    "d": 16.7,
    "yuan": 32.9,
    "usd": 4.55,
    "salesPrice": 6
  },
  {
    "name": "REALME C61",
    "cat": "REALME / LCD",
    "d": 17.2,
    "yuan": 33.88,
    "usd": 4.69,
    "salesPrice": 6
  },
  {
    "name": "Redmi 10 4g",
    "cat": "REDMI / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi 10c",
    "cat": "REDMI / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 4.2
  },
  {
    "name": "Redmi 12",
    "cat": "REDMI / LCD",
    "d": 18,
    "yuan": 35.46,
    "usd": 4.9,
    "salesPrice": 5.5
  },
  {
    "name": "Redmi 12c",
    "cat": "REDMI / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 5.2
  },
  {
    "name": "redmi 13",
    "cat": "REDMI / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 6
  },
  {
    "name": "Redmi 13c",
    "cat": "REDMI / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi 14c",
    "cat": "REDMI / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi 15c one cable",
    "cat": "REDMI / LCD",
    "d": 23.5,
    "yuan": 46.3,
    "usd": 6.4,
    "salesPrice": 7
  },
  {
    "name": "Redmi 15c Two cable",
    "cat": "REDMI / LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 6
  },
  {
    "name": "Redmi 9",
    "cat": "REDMI / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi 9c",
    "cat": "REDMI / LCD",
    "d": 15.4,
    "yuan": 30.34,
    "usd": 4.2,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi 9T",
    "cat": "REDMI / LCD",
    "d": 16.3,
    "yuan": 32.11,
    "usd": 4.44,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi a2 pLuse",
    "cat": "REDMI / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 5.2
  },
  {
    "name": "redmi a3",
    "cat": "REDMI / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.5
  },
  {
    "name": "redmi a5",
    "cat": "REDMI / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.3
  },
  {
    "name": "redmi a5 uk",
    "cat": "REDMI / LCD",
    "d": 23.5,
    "yuan": 46.3,
    "usd": 6.4,
    "salesPrice": 7
  },
  {
    "name": "Redmi Note 10 4g",
    "cat": "REDMI / LCD",
    "d": 16.9,
    "yuan": 33.29,
    "usd": 4.6,
    "salesPrice": 5.5
  },
  {
    "name": "Redmi Note 10 5G",
    "cat": "REDMI / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi Note 10 PRO 4G",
    "cat": "REDMI / LCD",
    "d": 19.2,
    "yuan": 37.82,
    "usd": 5.23,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi NOTE 11e , redmi 10 5g",
    "cat": "REDMI / LCD",
    "d": 17.8,
    "yuan": 35.07,
    "usd": 4.85,
    "salesPrice": 6
  },
  {
    "name": "Redmi Note 11S",
    "cat": "REDMI / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi Note 11S",
    "cat": "REDMI / LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.04
  },
  {
    "name": "Redmi NOTE 12",
    "cat": "REDMI / LCD",
    "d": 19,
    "yuan": 37.43,
    "usd": 5.18,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi Note 13",
    "cat": "REDMI / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi Note 13 PRO",
    "cat": "REDMI / LCD",
    "d": 20.3,
    "yuan": 39.99,
    "usd": 5.53,
    "salesPrice": 6.5
  },
  {
    "name": "Redmi NOTE 8",
    "cat": "REDMI / LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 5.2
  },
  {
    "name": "Redmi note 9",
    "cat": "REDMI / LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 5.5
  },
  {
    "name": "Redmi note 9 PRO",
    "cat": "REDMI / LCD",
    "d": 17,
    "yuan": 33.49,
    "usd": 4.63,
    "salesPrice": 5.5
  },
  {
    "name": "RUMAAN 14 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "SAHAL 16 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6,
    "usd": 0.88,
    "salesPrice": 1.1
  },
  {
    "name": "SAHAL 16 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 6,
    "usd": 0.88,
    "salesPrice": 0.88
  },
  {
    "name": "SAHAL 16 PIN YARYAR",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 3.7,
    "usd": 0.54,
    "salesPrice": 1.1
  },
  {
    "name": "SENSOR +SPEAKER 13 PRO MAX",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.04,
    "salesPrice": 4
  },
  {
    "name": "SENSOR +SPEAKER 13 PRO MAX",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.04,
    "salesPrice": 3.04
  },
  {
    "name": "SENSOR 13 PRO MAX",
    "cat": "IPHONE / SENSOR",
    "d": 0,
    "yuan": 0,
    "usd": 3.46,
    "salesPrice": 3.5
  },
  {
    "name": "SENSOR 14 PRO MAX",
    "cat": "IPHONE / SENSOR",
    "d": 0,
    "yuan": 0,
    "usd": 7.7,
    "salesPrice": 8.5
  },
  {
    "name": "SENSOR 15 PRO MAX",
    "cat": "IPHONE / SENSOR",
    "d": 0,
    "yuan": 0,
    "usd": 1.12,
    "salesPrice": 3
  },
  {
    "name": "SIM TRY  A03 CORE",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A04E",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A057",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A105",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A107",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A11",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A12",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A13",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A14",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A15",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A17",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A217",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A23",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A25",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A26",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A31",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A53",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A55",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A56",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A70",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A71",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A72",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  A73",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SIM TRY  M33",
    "cat": "SAMSUNG / SIM TRY",
    "d": 0,
    "yuan": 0,
    "usd": 0.15,
    "salesPrice": 0.3
  },
  {
    "name": "SPEAKER 11",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.62,
    "salesPrice": 4
  },
  {
    "name": "SPEAKER 11 PRO MAX",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.8,
    "salesPrice": 4
  },
  {
    "name": "SPEAKER 11PRO",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.53,
    "salesPrice": 4
  },
  {
    "name": "SPEAKER 12 PRO",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.23,
    "salesPrice": 4
  },
  {
    "name": "SPEAKER 12 PRO MAX",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 3.23,
    "salesPrice": 4
  },
  {
    "name": "SPEAKER X",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.61,
    "salesPrice": 3.5
  },
  {
    "name": "SPEAKER XR",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.8,
    "salesPrice": 3.5
  },
  {
    "name": "SPEAKER XS",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.68,
    "salesPrice": 3.5
  },
  {
    "name": "SPEAKER XS",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.68,
    "salesPrice": 2.68
  },
  {
    "name": "SPEAKER XS MAX",
    "cat": "IPHONE / SPEAKER",
    "d": 0,
    "yuan": 0,
    "usd": 2.92,
    "salesPrice": 3.5
  },
  {
    "name": "SWICH  A025",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A03 CORE",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A037",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A05",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 0.13,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A06",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 0.13,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A105",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A107",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A14",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A14",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 0.28,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A16",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH  A217",
    "cat": "SAMSUNG / SWICH",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "SWICH SMART 10",
    "cat": "INFINIX /  SWICH",
    "d": 0.33,
    "yuan": 0.65,
    "usd": 0.09,
    "salesPrice": 0.4
  },
  {
    "name": "SWICH SMART 7",
    "cat": "INFINIX /  SWICH",
    "d": 0.33,
    "yuan": 0.65,
    "usd": 0.09,
    "salesPrice": 0.4
  },
  {
    "name": "SWICH SMART 8",
    "cat": "INFINIX /  SWICH",
    "d": 0.33,
    "yuan": 0.65,
    "usd": 0.09,
    "salesPrice": 0.4
  },
  {
    "name": "SWICH SMART 9",
    "cat": "INFINIX /  SWICH",
    "d": 0.33,
    "yuan": 0.65,
    "usd": 0.09,
    "salesPrice": 0.4
  },
  {
    "name": "TECNO 20PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 1.1
  },
  {
    "name": "TECNO BD4",
    "cat": "TECNO /  LCD",
    "d": 15.9,
    "yuan": 31.32,
    "usd": 4.33,
    "salesPrice": 5.5
  },
  {
    "name": "TECNO CK6",
    "cat": "TECNO /  LCD",
    "d": 21,
    "yuan": 41.37,
    "usd": 5.72,
    "salesPrice": 6.5
  },
  {
    "name": "TECNO COMMON 15 PRO X660",
    "cat": "TECNO /  LCD",
    "d": 17.2,
    "yuan": 33.88,
    "usd": 4.69,
    "salesPrice": 5.5
  },
  {
    "name": "TECNO COMMON 15 X660",
    "cat": "TECNO /  LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.5
  },
  {
    "name": "TECNO ki7",
    "cat": "TECNO /  LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 5.7
  },
  {
    "name": "TECNO KJ6 , Spark 20 PRO",
    "cat": "TECNO /  LCD",
    "d": 18.5,
    "yuan": 36.45,
    "usd": 5.04,
    "salesPrice": 5.7
  },
  {
    "name": "TECNO KJ7 , Spark 20 PRO +",
    "cat": "TECNO /  LCD",
    "d": 26,
    "yuan": 51.22,
    "usd": 7.08,
    "salesPrice": 5.7
  },
  {
    "name": "TECNO KL4",
    "cat": "TECNO /  LCD",
    "d": 17.3,
    "yuan": 34.08,
    "usd": 4.71,
    "salesPrice": 6
  },
  {
    "name": "TECNO KL6 / x6882",
    "cat": "TECNO /  LCD",
    "d": 17.8,
    "yuan": 35.07,
    "usd": 4.85,
    "salesPrice": 6
  },
  {
    "name": "TECNO KL7 , hote 50 pro",
    "cat": "TECNO /  LCD",
    "d": 80.5,
    "yuan": 158.59,
    "usd": 21.93,
    "salesPrice": 24.5
  },
  {
    "name": "TECNO KM4 , hot 60i",
    "cat": "INFINIX /  LCD",
    "d": 18.2,
    "yuan": 35.85,
    "usd": 4.96,
    "salesPrice": 5.7
  },
  {
    "name": "TECNO Km7 , hot 40 pro pluse , hot 60 pro +",
    "cat": "TECNO /  LCD",
    "d": 80.5,
    "yuan": 158.59,
    "usd": 21.93,
    "salesPrice": 24.5
  },
  {
    "name": "TECNO LC6",
    "cat": "TECNO /  LCD",
    "d": 15.1,
    "yuan": 29.75,
    "usd": 4.11,
    "salesPrice": 6
  },
  {
    "name": "TECNO T302",
    "cat": "MINI / LCD",
    "d": 2.25,
    "yuan": 4.43,
    "usd": 0.61,
    "salesPrice": 0.1
  },
  {
    "name": "TECNO T349 16 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 3.7,
    "usd": 0.54,
    "salesPrice": 0.7
  },
  {
    "name": "TECNO T349 16 PIN",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 3.7,
    "usd": 0.54,
    "salesPrice": 0.54
  },
  {
    "name": "TECNO T402",
    "cat": "MINI / LCD",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.9
  },
  {
    "name": "TECNO T528",
    "cat": "MINI / LCD",
    "d": 3.35,
    "yuan": 6.6,
    "usd": 0.91,
    "salesPrice": 1.1
  },
  {
    "name": "USB A03 CORE",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.04
  },
  {
    "name": "USB A057",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.015
  },
  {
    "name": "USB A105",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.04
  },
  {
    "name": "USB A107",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.04
  },
  {
    "name": "USB A11",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.085
  },
  {
    "name": "USB A12",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.07
  },
  {
    "name": "USB BG6",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.06
  },
  {
    "name": "USB BMB",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.04
  },
  {
    "name": "USB RAYAN",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.07
  },
  {
    "name": "USB TECN T349",
    "cat": "SAMSUNG / USB",
    "d": 0.07,
    "yuan": 0.14,
    "usd": 0.02,
    "salesPrice": 0.04
  },
  {
    "name": "USB TECN T349",
    "cat": "SAMSUNG / USB",
    "d": 0.07,
    "yuan": 0.14,
    "usd": 0.02,
    "salesPrice": 0.02
  },
  {
    "name": "USB TECNO NEW",
    "cat": "SAMSUNG / USB",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.04
  },
  {
    "name": "VIVO V50",
    "cat": "VIVO / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 6
  },
  {
    "name": "VIVO V80",
    "cat": "VIVO / LCD",
    "d": 37,
    "yuan": 72.89,
    "usd": 10.08,
    "salesPrice": 11.5
  },
  {
    "name": "VIVO Y03",
    "cat": "VIVO / LCD",
    "d": 16.5,
    "yuan": 32.51,
    "usd": 4.5,
    "salesPrice": 6
  },
  {
    "name": "VIVO Y04",
    "cat": "VIVO / LCD",
    "d": 17.9,
    "yuan": 35.26,
    "usd": 4.88,
    "salesPrice": 6
  },
  {
    "name": "VIVO Y20",
    "cat": "VIVO / LCD",
    "d": 16,
    "yuan": 31.52,
    "usd": 4.36,
    "salesPrice": 6
  },
  {
    "name": "VIVO Y21",
    "cat": "VIVO / LCD",
    "d": 15.7,
    "yuan": 30.93,
    "usd": 4.28,
    "salesPrice": 6
  },
  {
    "name": "VIVO Y29",
    "cat": "VIVO / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 6
  },
  {
    "name": "VOLUME A107",
    "cat": "SAMSUNG / VOLUME",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "VOLUMEN A207",
    "cat": "SAMSUNG / VOLUME",
    "d": 0,
    "yuan": 0,
    "usd": 1,
    "salesPrice": 0.3
  },
  {
    "name": "ZTE a35e",
    "cat": "ZTE / LCD",
    "d": 17.5,
    "yuan": 34.48,
    "usd": 4.77,
    "salesPrice": 6
  },
  {
    "name": "ZTE A55 / A35",
    "cat": "ZTE / LCD",
    "d": 18.7,
    "yuan": 36.84,
    "usd": 5.1,
    "salesPrice": 6
  },
  {
    "name": "ZTE A76/A56",
    "cat": "ZTE / LCD",
    "d": 19.5,
    "yuan": 38.42,
    "usd": 5.31,
    "salesPrice": 6
  },
  {
    "name": "ZTE C35",
    "cat": "ZTE / LCD",
    "d": 18.8,
    "yuan": 37.04,
    "usd": 5.12,
    "salesPrice": 6
  },
  {
    "name": "ZTE V50",
    "cat": "ZTE / LCD",
    "d": 20.5,
    "yuan": 40.39,
    "usd": 5.59,
    "salesPrice": 6.5
  },
  {
    "name": "ZTE V80 MAX",
    "cat": "ZTE / LCD",
    "d": 25,
    "yuan": 49.25,
    "usd": 6.81,
    "salesPrice": 8
  },
  {
    "name": "ZY 11 PRO",
    "cat": "IPhone / LCD",
    "d": 28.5,
    "yuan": 56.15,
    "usd": 7.77,
    "salesPrice": 8.8
  },
  {
    "name": "ZY 11 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 29.2,
    "yuan": 57.52,
    "usd": 7.96,
    "salesPrice": 8.8
  },
  {
    "name": "ZY 12 PRO",
    "cat": "IPhone / LCD",
    "d": 29,
    "yuan": 57.13,
    "usd": 7.9,
    "salesPrice": 8.8
  },
  {
    "name": "ZY 12 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 32.5,
    "yuan": 64.03,
    "usd": 8.86,
    "salesPrice": 9.8
  },
  {
    "name": "ZY 13",
    "cat": "IPhone / LCD",
    "d": 29.5,
    "yuan": 58.12,
    "usd": 8.04,
    "salesPrice": 8.8
  },
  {
    "name": "ZY 13 PRO",
    "cat": "IPhone / LCD",
    "d": 37.5,
    "yuan": 73.88,
    "usd": 10.22,
    "salesPrice": 11.5
  },
  {
    "name": "ZY 13 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 40.7,
    "yuan": 80.18,
    "usd": 11.09,
    "salesPrice": 12.5
  },
  {
    "name": "ZY 14",
    "cat": "IPhone / LCD",
    "d": 30,
    "yuan": 59.1,
    "usd": 8.17,
    "salesPrice": 12
  },
  {
    "name": "ZY 14 pluse",
    "cat": "IPhone / LCD",
    "d": 38,
    "yuan": 74.86,
    "usd": 10.35,
    "salesPrice": 12
  },
  {
    "name": "ZY 14 PRO",
    "cat": "IPhone / LCD",
    "d": 39.5,
    "yuan": 77.82,
    "usd": 10.76,
    "salesPrice": 14
  },
  {
    "name": "ZY 14 PRO",
    "cat": "IPhone / LCD",
    "d": 39.5,
    "yuan": 77.82,
    "usd": 10.76,
    "salesPrice": 10.76
  },
  {
    "name": "ZY 14 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 42,
    "yuan": 82.74,
    "usd": 11.44,
    "salesPrice": 14
  },
  {
    "name": "ZY 15 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 42.5,
    "yuan": 83.73,
    "usd": 11.58,
    "salesPrice": 14
  },
  {
    "name": "ZY 16 PRO MAX",
    "cat": "IPhone / LCD",
    "d": 69,
    "yuan": 135.93,
    "usd": 18.8,
    "salesPrice": 23
  },
  {
    "name": "ZY Xs",
    "cat": "IPhone / LCD",
    "d": 23.5,
    "yuan": 46.3,
    "usd": 6.4,
    "salesPrice": 7.5
  },
  {
    "name": "ZY Xs",
    "cat": "IPhone / LCD",
    "d": 23.8,
    "yuan": 46.89,
    "usd": 6.49,
    "salesPrice": 7.2
  },
  {
    "name": "ZY XS MAX",
    "cat": "IPhone / LCD",
    "d": 27,
    "yuan": 53.19,
    "usd": 7.36,
    "salesPrice": 8.2
  },
  {
    "name": "X9D OLED",
    "cat": "HONOR / LCD",
    "d": 91,
    "yuan": 179.27,
    "usd": 24.8,
    "salesPrice": 27.5
  },
  {
    "name": "REALME C65",
    "cat": "REALME / LCD",
    "d": 16.9,
    "yuan": 33.29,
    "usd": 4.6,
    "salesPrice": 6
  },
  {
    "name": "INFINIX X655",
    "cat": "INFINIX /  LCD",
    "d": 15.5,
    "yuan": 30.54,
    "usd": 4.22,
    "salesPrice": 5.5
  },
  {
    "name": "Y6P 2020",
    "cat": "HUAWIE / LCD",
    "d": 16.2,
    "yuan": 31.91,
    "usd": 4.41,
    "salesPrice": 6
  }
];

export function getNajiHassanCatalog(): SparePartItem[] {
  return NAJI_HASSAN_DATA.map((item, idx) => {
    const salesPrice = item.salesPrice > 0 ? item.salesPrice : item.usd;
    const isLcd = item.cat && item.cat.includes('LCD');
    const defaultOrigin: 'Dubai' | 'China' = isLcd ? 'China' : 'Dubai';
    const smartId = generateSmartPartId(item.name, undefined, 'air', defaultOrigin);
    return {
      id: `${smartId}-${idx + 1}`,
      cat: item.cat,
      name: item.name,
      d: item.d,
      usd: item.usd,
      yuan: item.yuan,
      salesPrice,
      salesPriceD: Number((salesPrice * 3.67).toFixed(1)),
      expense: 0,
      shippingMethod: 'air' as const,
      origin: defaultOrigin
    };
  });
}
