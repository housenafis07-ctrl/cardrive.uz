export type VehicleBrand = { name: string; slug: string; logo: string; country: string; models: string[] };

export const VEHICLE_BRANDS: VehicleBrand[] = [
  { name:"Audi",slug:"audi",logo:"https://cdn.simpleicons.org/audi",country:"Germany",models:["A3","A4","A5","A6","A7","A8","Q3","Q5","Q7","Q8","e-tron"] },
  { name:"BMW",slug:"bmw",logo:"https://cdn.simpleicons.org/bmw",country:"Germany",models:["1 Series","2 Series","3 Series","4 Series","5 Series","7 Series","X1","X3","X5","X6","X7","iX"] },
  { name:"BYD",slug:"byd",logo:"https://cdn.simpleicons.org/byd",country:"China",models:["Atto 3","Dolphin","Han","Qin","Song","Song Plus","Tang","Seagull","Seal","Yuan Up","Chazor","Destroyer 05"] },
  { name:"Changan",slug:"changan",logo:"https://cdn.simpleicons.org/changan",country:"China",models:["Alsvin","CS35 Plus","CS55 Plus","CS75 Plus","UNI-T","UNI-K","Eado","Deepal S07"] },
  { name:"Chery",slug:"chery",logo:"https://cdn.simpleicons.org/chery",country:"China",models:["Arrizo 5","Arrizo 6","Tiggo 2","Tiggo 4","Tiggo 7","Tiggo 8","Exeed LX","Exeed TXL","Exeed VX"] },
  { name:"Chevrolet",slug:"chevrolet",logo:"https://cdn.simpleicons.org/chevrolet",country:"USA",models:["Cobalt","Damas","Gentra","Lacetti","Malibu","Onix","Spark","Tracker","Trailblazer","Captiva","Equinox","Tahoe"] },
  { name:"Denza",slug:"denza",logo:"https://cdn.simpleicons.org/byd",country:"China",models:["D9","N7","N8","Z9 GT"] },
  { name:"Dongfeng",slug:"dongfeng",logo:"https://cdn.simpleicons.org/dongfeng",country:"China",models:["Aeolus","Fengon 500","Fengon 580","Huge","Shine"] },
  { name:"Ford",slug:"ford",logo:"https://cdn.simpleicons.org/ford",country:"USA",models:["Focus","Fusion","Mondeo","Mustang","Explorer","Escape","Edge","F-150","Ranger","Territory"] },
  { name:"Geely",slug:"geely",logo:"https://cdn.simpleicons.org/geely",country:"China",models:["Coolray","Atlas","Monjaro","Emgrand","Geometry C","Tugella","Okavango","Starray"] },
  { name:"GAC",slug:"gac",logo:"https://cdn.simpleicons.org/gac",country:"China",models:["GS3","GS4","GS8","Empow","Aion Y","Aion S","M8"] },
  { name:"Haval",slug:"haval",logo:"https://cdn.simpleicons.org/haval",country:"China",models:["Jolion","H6","H9","Dargo","F7","M6"] },
  { name:"Honda",slug:"honda",logo:"https://cdn.simpleicons.org/honda",country:"Japan",models:["Civic","Accord","CR-V","HR-V","Pilot","City","Fit","Odyssey"] },
  { name:"Hyundai",slug:"hyundai",logo:"https://cdn.simpleicons.org/hyundai",country:"South Korea",models:["Accent","Elantra","Sonata","Tucson","Santa Fe","Palisade","Kona","Creta","Ioniq 5"] },
  { name:"Jetour",slug:"jetour",logo:"https://cdn.simpleicons.org/jetour",country:"China",models:["X50","X70","X70 Plus","X90 Plus","Dashing","T2"] },
  { name:"Kia",slug:"kia",logo:"https://cdn.simpleicons.org/kia",country:"South Korea",models:["K5","K8","K9","Sportage","Sorento","Seltos","Sonet","Carnival","EV6","EV9","Cerato"] },
  { name:"Lexus",slug:"lexus",logo:"https://cdn.simpleicons.org/lexus",country:"Japan",models:["ES","IS","LS","NX","RX","GX","LX","UX","RZ"] },
  { name:"Li Auto",slug:"li-auto",logo:"https://cdn.simpleicons.org/lixiang",country:"China",models:["L6","L7","L8","L9","Mega"] },
  { name:"Mazda",slug:"mazda",logo:"https://cdn.simpleicons.org/mazda",country:"Japan",models:["Mazda 3","Mazda 6","CX-3","CX-5","CX-30","CX-9","CX-60"] },
  { name:"Mercedes-Benz",slug:"mercedes-benz",logo:"https://cdn.simpleicons.org/mercedes",country:"Germany",models:["A-Class","C-Class","E-Class","S-Class","GLA","GLC","GLE","GLS","G-Class","EQA","EQE","EQS"] },
  { name:"Mitsubishi",slug:"mitsubishi",logo:"https://cdn.simpleicons.org/mitsubishi",country:"Japan",models:["Attrage","Lancer","Outlander","Pajero","ASX","Eclipse Cross","L200"] },
  { name:"Nissan",slug:"nissan",logo:"https://cdn.simpleicons.org/nissan",country:"Japan",models:["Altima","Sentra","X-Trail","Qashqai","Patrol","Juke","Leaf","Pathfinder"] },
  { name:"Omoda",slug:"omoda",logo:"https://cdn.simpleicons.org/chery",country:"China",models:["C5","C7","E5"] },
  { name:"Peugeot",slug:"peugeot",logo:"https://cdn.simpleicons.org/peugeot",country:"France",models:["208","301","308","408","508","2008","3008","5008","Partner"] },
  { name:"Porsche",slug:"porsche",logo:"https://cdn.simpleicons.org/porsche",country:"Germany",models:["911","Cayenne","Macan","Panamera","Taycan","718"] },
  { name:"Renault",slug:"renault",logo:"https://cdn.simpleicons.org/renault",country:"France",models:["Logan","Sandero","Duster","Kaptur","Arkana","Koleos","Megane"] },
  { name:"Subaru",slug:"subaru",logo:"https://cdn.simpleicons.org/subaru",country:"Japan",models:["Forester","Outback","Crosstrek","Impreza","Legacy","WRX"] },
  { name:"Tesla",slug:"tesla",logo:"https://cdn.simpleicons.org/tesla",country:"USA",models:["Model 3","Model S","Model X","Model Y","Cybertruck"] },
  { name:"Toyota",slug:"toyota",logo:"https://cdn.simpleicons.org/toyota",country:"Japan",models:["Camry","Corolla","RAV4","Land Cruiser","Prado","Highlander","Hilux","Avalon","C-HR","bZ4X"] },
  { name:"Volkswagen",slug:"volkswagen",logo:"https://cdn.simpleicons.org/volkswagen",country:"Germany",models:["Polo","Golf","Jetta","Passat","Tiguan","Touareg","Teramont","ID.4"] },
  { name:"Volvo",slug:"volvo",logo:"https://cdn.simpleicons.org/volvo",country:"Sweden",models:["S60","S90","XC40","XC60","XC90","EX30","EX90"] },
  { name:"Zeekr",slug:"zeekr",logo:"https://cdn.simpleicons.org/zeekr",country:"China",models:["001","007","009","X","7X"] },
  { name:"Other",slug:"other",logo:"",country:"Other",models:[] },
];

export function findVehicleBrand(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  return VEHICLE_BRANDS.find(item => item.name.toLocaleLowerCase() === normalized || item.slug === normalized);
}
