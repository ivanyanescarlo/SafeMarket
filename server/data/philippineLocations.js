/**
 * SafeMarket - Comprehensive Philippine Provinces and Cities/Municipalities
 */
const PHILIPPINE_LOCATIONS = [
  {
    province: "Metro Manila (NCR)",
    cities: [
      "Caloocan",
      "Las Piñas",
      "Makati",
      "Malabon",
      "Mandaluyong",
      "Manila",
      "Marikina",
      "Muntinlupa",
      "Navotas",
      "Parañaque",
      "Pasay",
      "Pasig",
      "Pateros",
      "Quezon City",
      "San Juan",
      "Taguig",
      "Valenzuela"
    ]
  },
  {
    province: "Cebu",
    cities: [
      "Cebu City",
      "Mandaue",
      "Lapu-Lapu",
      "Talisay",
      "Toledo",
      "Danao",
      "Naga",
      "Carcar",
      "Bogo",
      "Consolacion",
      "Liloan",
      "Minglanilla",
      "San Fernando",
      "Balamban"
    ]
  },
  {
    province: "Davao del Sur",
    cities: [
      "Davao City",
      "Digos",
      "Santa Cruz",
      "Bansalan",
      "Hagonoy",
      "Matanao",
      "Magsaysay",
      "Malalag",
      "Padada",
      "Sulop"
    ]
  },
  {
    province: "Cavite",
    cities: [
      "Bacoor",
      "Imus",
      "Dasmariñas",
      "General Trias",
      "Cavite City",
      "Tagaytay",
      "Trece Martires",
      "Silang",
      "Kawit",
      "Noveleta",
      "Rosario",
      "Tanza",
      "Carmona",
      "Naic",
      "Alfonso",
      "Indang"
    ]
  },
  {
    province: "Laguna",
    cities: [
      "Calamba",
      "Santa Rosa",
      "Biñan",
      "San Pedro",
      "Cabuyao",
      "San Pablo",
      "Los Baños",
      "Bay",
      "Pila",
      "Sta. Cruz",
      "Siniloan",
      "Liliw",
      "Nagcarlan",
      "Pagsanjan"
    ]
  },
  {
    province: "Rizal",
    cities: [
      "Antipolo",
      "Cainta",
      "Taytay",
      "San Mateo",
      "Rodriguez (Montalban)",
      "Binangonan",
      "Angono",
      "Morong",
      "Tanay",
      "Pililla",
      "Baras",
      "Teresa",
      "Cardona",
      "Jala-jala"
    ]
  },
  {
    province: "Batangas",
    cities: [
      "Batangas City",
      "Lipa",
      "Tanauan",
      "Santo Tomas",
      "Nasugbu",
      "Bauan",
      "Lemery",
      "Balayan",
      "Calaca",
      "San Jose",
      "Rosario",
      "Mabini"
    ]
  },
  {
    province: "Bulacan",
    cities: [
      "Malolos",
      "Meycauayan",
      "San Jose del Monte",
      "Marilao",
      "Santa Maria",
      "Baliuag",
      "Guiguinto",
      "Bocaue",
      "Plaridel",
      "Hagonoy",
      "Calumpit",
      "Pulilan"
    ]
  },
  {
    province: "Pampanga",
    cities: [
      "San Fernando",
      "Angeles City",
      "Mabalacat",
      "Guagua",
      "Lubao",
      "Mexico",
      "Arayat",
      "Floridablanca",
      "Porac",
      "Apalit",
      "Candaba"
    ]
  },
  {
    province: "Benguet",
    cities: [
      "Baguio",
      "La Trinidad",
      "Itogon",
      "Tuba",
      "Tublay",
      "Kapangan",
      "Buguias"
    ]
  },
  {
    province: "Iloilo",
    cities: [
      "Iloilo City",
      "Passi",
      "Oton",
      "Pavia",
      "Santa Barbara",
      "Leganes",
      "Pototan",
      "Dumangas",
      "Miagao",
      "Janiuay"
    ]
  },
  {
    province: "Negros Occidental",
    cities: [
      "Bacolod",
      "Talisay",
      "Silay",
      "Bago",
      "Cadiz",
      "Sagay",
      "San Carlos",
      "Victorias",
      "Kabankalan",
      "Himamaylan",
      "La Carlota"
    ]
  },
  {
    province: "Misamis Oriental",
    cities: [
      "Cagayan de Oro",
      "Gingoog",
      "El Salvador",
      "Tagoloan",
      "Opol",
      "Villanueva",
      "Jasaan",
      "Initao"
    ]
  },
  {
    province: "South Cotabato",
    cities: [
      "General Santos",
      "Koronadal",
      "Polomolok",
      "Tupi",
      "Surallah",
      "Banga",
      "Tantangan"
    ]
  },
  {
    province: "Zamboanga del Sur",
    cities: [
      "Zamboanga City",
      "Pagadian",
      "Aurora",
      "Molave",
      "Dumalinao",
      "San Miguel"
    ]
  },
  {
    province: "Pangasinan",
    cities: [
      "Agno",
      "Aguilar",
      "Alaminos",
      "Alcala",
      "Anda",
      "Asingan",
      "Balungao",
      "Bani",
      "Basista",
      "Bautista",
      "Bayambang",
      "Binalonan",
      "Binmaley",
      "Bolinao",
      "Bugallon",
      "Burgos",
      "Calasiao",
      "Dagupan",
      "Dasol",
      "Infanta",
      "Labrador",
      "Laoac",
      "Lingayen",
      "Mabini",
      "Malasiqui",
      "Manaoag",
      "Mangaldan",
      "Mangatarem",
      "Mapandan",
      "Natividad",
      "Pozorrubio",
      "Rosales",
      "San Carlos",
      "San Fabian",
      "San Jacinto",
      "San Manuel",
      "San Nicolas",
      "San Quintin",
      "Santa Barbara",
      "Santa Maria",
      "Santo Tomas",
      "Sison",
      "Sual",
      "Tayug",
      "Umingan",
      "Urbiztondo",
      "Urdaneta",
      "Villasis"
    ]
  },
  {
    province: "Palawan",
    cities: [
      "Puerto Princesa",
      "Coron",
      "El Nido",
      "San Vicente",
      "Brooke's Point",
      "Roxas",
      "Narra"
    ]
  },
  {
    province: "Bohol",
    cities: [
      "Tagbilaran",
      "Tubigon",
      "Panglao",
      "Dauis",
      "Ubay",
      "Carmen",
      "Talibon",
      "Loay"
    ]
  },
  {
    province: "Leyte",
    cities: [
      "Tacloban",
      "Ormoc",
      "Baybay",
      "Palo",
      "Tanauan",
      "Carigara",
      "Hilongos",
      "Alangalang"
    ]
  },
  {
    province: "Albay",
    cities: [
      "Legazpi",
      "Ligao",
      "Tabaco",
      "Daraga",
      "Polangui",
      "Guinobatan",
      "Camalig"
    ]
  },
  {
    province: "Camarines Sur",
    cities: [
      "Naga",
      "Iriga",
      "Pili",
      "Calabanga",
      "Libmanan",
      "Nabua",
      "Goa",
      "Canaman"
    ]
  },
  {
    province: "Isabela",
    cities: [
      "Ilagan",
      "Cauayan",
      "Santiago",
      "Roxas",
      "Echague",
      "San Mateo",
      "Tumauini"
    ]
  },
  {
    province: "Tarlac",
    cities: [
      "Tarlac City",
      "Capas",
      "Concepcion",
      "Paniqui",
      "Gerona",
      "Camiling",
      "Bamban"
    ]
  },
  {
    province: "Nueva Ecija",
    cities: [
      "Cabanatuan",
      "Gapan",
      "San Jose",
      "Palayan",
      "Muñoz",
      "Talavera",
      "Guimba",
      "San Leonardo"
    ]
  },
  {
    province: "Quezon Province",
    cities: [
      "Lucena",
      "Tayabas",
      "Candelaria",
      "Sariaya",
      "Tiaong",
      "Pagbilao",
      "Gumaca",
      "Lopez"
    ]
  }
];

module.exports = PHILIPPINE_LOCATIONS;
