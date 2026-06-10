const GRUPOS = {
  A: { equipos: ['MEX', 'RSA', 'KOR', 'CZE'], nom: 'A' },
  B: { equipos: ['CAN', 'BIH', 'QAT', 'SUI'], nom: 'B' },
  C: { equipos: ['BRA', 'MAR', 'HAI', 'SCO'], nom: 'C' },
  D: { equipos: ['USA', 'PAR', 'AUS', 'TUR'], nom: 'D' },
  E: { equipos: ['GER', 'CUW', 'CIV', 'ECU'], nom: 'E' },
  F: { equipos: ['NED', 'JPN', 'SWE', 'TUN'], nom: 'F' },
  G: { equipos: ['BEL', 'EGY', 'IRN', 'NZL'], nom: 'G' },
  H: { equipos: ['ESP', 'CPV', 'KSA', 'URU'], nom: 'H' },
  I: { equipos: ['FRA', 'SEN', 'IRQ', 'NOR'], nom: 'I' },
  J: { equipos: ['ARG', 'ALG', 'AUT', 'JOR'], nom: 'J' },
  K: { equipos: ['POR', 'COD', 'UZB', 'COL'], nom: 'K' },
  L: { equipos: ['ENG', 'CRO', 'GHA', 'PAN'], nom: 'L' },
}

const PAISES = {
  MEX:'🇲🇽 México', RSA:'🇿🇦 Sudáfrica', KOR:'🇰🇷 Corea del Sur', CZE:'🇨🇿 Chequia',
  CAN:'🇨🇦 Canadá', BIH:'🇧🇦 Bosnia', QAT:'🇶🇦 Qatar', SUI:'🇨🇭 Suiza',
  BRA:'🇧🇷 Brasil', MAR:'🇲🇦 Marruecos', HAI:'🇭🇹 Haití', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia',
  USA:'🇺🇸 USA', PAR:'🇵🇾 Paraguay', AUS:'🇦🇺 Australia', TUR:'🇹🇷 Turquía',
  GER:'🇩🇪 Alemania', CUW:'🇨🇼 Curazao', CIV:'🇨🇮 Costa de Marfil', ECU:'🇪🇨 Ecuador',
  NED:'🇳🇱 Países Bajos', JPN:'🇯🇵 Japón', SWE:'🇸🇪 Suecia', TUN:'🇹🇳 Túnez',
  BEL:'🇧🇪 Bélgica', EGY:'🇪🇬 Egipto', IRN:'🇮🇷 Irán', NZL:'🇳🇿 Nueva Zelanda',
  ESP:'🇪🇸 España', CPV:'🇨🇻 Cabo Verde', KSA:'🇸🇦 Arabia Saudita', URU:'🇺🇾 Uruguay',
  FRA:'🇫🇷 Francia', SEN:'🇸🇳 Senegal', IRQ:'🇮🇷 Irak', NOR:'🇳🇴 Noruega',
  ARG:'🇦🇷 Argentina', ALG:'🇩🇿 Argelia', AUT:'🇦🇹 Austria', JOR:'🇯🇴 Jordania',
  POR:'🇵🇹 Portugal', COD:'🇨🇩 RD Congo', UZB:'🇺🇿 Uzbekistán', COL:'🇨🇴 Colombia',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', CRO:'🇭🇷 Croacia', GHA:'🇬🇭 Ghana', PAN:'🇵🇦 Panamá',
}

const SEDES = {
  Vancouver:   { ciudad:'Vancouver',   estadio:'BC Place',         zona:'Oeste', et:-3 },
  Seattle:     { ciudad:'Seattle',     estadio:'Lumen Field',      zona:'Oeste', et:-3 },
  SanFrancisco:{ ciudad:'San Francisco',estadio:'Levi\'s Stadium',  zona:'Oeste', et:-3 },
  LosAngeles:  { ciudad:'Los Ángeles',  estadio:'SoFi Stadium',     zona:'Oeste', et:-3 },
  Guadalajara: { ciudad:'Guadalajara',  estadio:'Estadio Akron',    zona:'Oeste', et:-2 },
  CiudadMexico:{ ciudad:'Ciudad de México',estadio:'Estadio Azteca',zona:'Oeste', et:-2 },
  Monterrey:   { ciudad:'Monterrey',    estadio:'Estadio BBVA',     zona:'Oeste', et:-2 },
  Houston:     { ciudad:'Houston',      estadio:'NRG Stadium',      zona:'Central',et:-1 },
  Dallas:      { ciudad:'Dallas',       estadio:'AT&T Stadium',     zona:'Central',et:-1 },
  KansasCity:  { ciudad:'Kansas City',  estadio:'Arrowhead Stadium',zona:'Central',et:-1 },
  Atlanta:     { ciudad:'Atlanta',      estadio:'Mercedes-Benz Stadium',zona:'Central',et:-1 },
  Miami:       { ciudad:'Miami',        estadio:'Hard Rock Stadium',zona:'Central',et:-1 },
  Toronto:     { ciudad:'Toronto',      estadio:'BMO Field',        zona:'Este',   et:0 },
  Boston:      { ciudad:'Boston',       estadio:'Gillette Stadium', zona:'Este',   et:0 },
  Philadelphia:{ ciudad:'Filadelfia',   estadio:'Lincoln Financial Field',zona:'Este',et:0 },
  NewYork:     { ciudad:'Nueva York/Nueva Jersey',estadio:'MetLife Stadium',zona:'Este',et:0 },
}

const PARTIDOS_FASE_GRUPOS = [
  // Grupo A
  { id:1,  fecha:'2026-06-11', hora:'15:00', sede:'CiudadMexico', local:'MEX', visitante:'RSA', grupo:'A' },
  { id:2,  fecha:'2026-06-11', hora:'22:00', sede:'Guadalajara', local:'KOR', visitante:'CZE', grupo:'A' },
  { id:25, fecha:'2026-06-18', hora:'12:00', sede:'Atlanta', local:'CZE', visitante:'RSA', grupo:'A' },
  { id:28, fecha:'2026-06-18', hora:'21:00', sede:'Guadalajara', local:'MEX', visitante:'KOR', grupo:'A' },
  { id:39, fecha:'2026-06-23', hora:'15:00', sede:'LosAngeles', local:'SUI', visitante:'BIH', grupo:'A', pendiente:true },
  { id:48, fecha:'2026-06-24', hora:'22:00', sede:'Guadalajara', local:'COL', visitante:'MEX', grupo:'A', pendiente:true },

  // Grupo B
  { id:3,  fecha:'2026-06-12', hora:'15:00', sede:'Toronto', local:'CAN', visitante:'BIH', grupo:'B' },
  { id:8,  fecha:'2026-06-13', hora:'15:00', sede:'SanFrancisco', local:'QAT', visitante:'SUI', grupo:'B' },
  { id:26, fecha:'2026-06-18', hora:'15:00', sede:'LosAngeles', local:'SUI', visitante:'BIH', grupo:'B' },
  { id:27, fecha:'2026-06-18', hora:'18:00', sede:'Vancouver', local:'CAN', visitante:'QAT', grupo:'B' },
  { id:38, fecha:'2026-06-22', hora:'12:00', sede:'Atlanta', local:'ESP', visitante:'KSA', grupo:'B', pendiente:true },
  { id:47, fecha:'2026-06-24', hora:'13:00', sede:'Houston', local:'POR', visitante:'UZB', grupo:'B', pendiente:true },

  // Grupo C
  { id:7,  fecha:'2026-06-13', hora:'18:00', sede:'NewYork', local:'BRA', visitante:'MAR', grupo:'C' },
  { id:5,  fecha:'2026-06-13', hora:'21:00', sede:'Boston', local:'HAI', visitante:'SCO', grupo:'C' },
  { id:29, fecha:'2026-06-20', hora:'20:30', sede:'Philadelphia', local:'BRA', visitante:'HAI', grupo:'C' },
  { id:30, fecha:'2026-06-20', hora:'18:00', sede:'Boston', local:'SCO', visitante:'MAR', grupo:'C' },
  { id:42, fecha:'2026-06-23', hora:'17:00', sede:'Philadelphia', local:'FRA', visitante:'IRQ', grupo:'C', pendiente:true },
  { id:49, fecha:'2026-06-25', hora:'18:00', sede:'Miami', local:'SCO', visitante:'BRA', grupo:'C', pendiente:true },

  // Grupo D
  { id:4,  fecha:'2026-06-12', hora:'21:00', sede:'LosAngeles', local:'USA', visitante:'PAR', grupo:'D' },
  { id:6,  fecha:'2026-06-13', hora:'00:00', sede:'Vancouver', local:'AUS', visitante:'TUR', grupo:'D' },
  { id:31, fecha:'2026-06-20', hora:'23:00', sede:'SanFrancisco', local:'TUR', visitante:'PAR', grupo:'D' },
  { id:32, fecha:'2026-06-20', hora:'15:00', sede:'Seattle', local:'USA', visitante:'AUS', grupo:'D' },
  { id:44, fecha:'2026-06-24', hora:'23:00', sede:'SanFrancisco', local:'JOR', visitante:'ALG', grupo:'D', pendiente:true },
  { id:50, fecha:'2026-06-25', hora:'18:00', sede:'Atlanta', local:'MAR', visitante:'HAI', grupo:'D', pendiente:true },

  // Grupo E
  { id:9,  fecha:'2026-06-13', hora:'19:00', sede:'Philadelphia', local:'CIV', visitante:'ECU', grupo:'E' },
  { id:10, fecha:'2026-06-14', hora:'13:00', sede:'Houston', local:'GER', visitante:'CUW', grupo:'E' },
  { id:34, fecha:'2026-06-21', hora:'20:00', sede:'KansasCity', local:'ECU', visitante:'CUW', grupo:'E' },
  { id:35, fecha:'2026-06-21', hora:'13:00', sede:'Houston', local:'GER', visitante:'CIV', grupo:'E', pendiente:true },
  { id:46, fecha:'2026-06-24', hora:'19:00', sede:'Miami', local:'PAN', visitante:'CRO', grupo:'E', pendiente:true },
  { id:56, fecha:'2026-06-26', hora:'16:00', sede:'NewYork', local:'ECU', visitante:'GER', grupo:'E', pendiente:true },

  // Grupo F
  { id:11, fecha:'2026-06-14', hora:'16:00', sede:'Dallas', local:'NED', visitante:'JPN', grupo:'F' },
  { id:12, fecha:'2026-06-14', hora:'22:00', sede:'Monterrey', local:'SWE', visitante:'TUN', grupo:'F' },
  { id:36, fecha:'2026-06-22', hora:'00:00', sede:'Monterrey', local:'TUN', visitante:'JPN', grupo:'F' },
  { id:37, fecha:'2026-06-22', hora:'18:00', sede:'Miami', local:'KSA', visitante:'CPV', grupo:'F', pendiente:true },
  { id:51, fecha:'2026-06-25', hora:'15:00', sede:'Seattle', local:'NZL', visitante:'EGY', grupo:'F', pendiente:true },
  { id:55, fecha:'2026-06-26', hora:'16:00', sede:'Philadelphia', local:'CUW', visitante:'CIV', grupo:'F', pendiente:true },

  // Grupo G
  { id:15, fecha:'2026-06-15', hora:'21:00', sede:'LosAngeles', local:'IRN', visitante:'NZL', grupo:'G' },
  { id:16, fecha:'2026-06-15', hora:'15:00', sede:'Seattle', local:'BEL', visitante:'EGY', grupo:'G' },
  { id:33, fecha:'2026-06-21', hora:'16:00', sede:'Houston', local:'GER', visitante:'CIV', grupo:'G', pendiente:true },
  { id:40, fecha:'2026-06-23', hora:'21:00', sede:'Vancouver', local:'NZL', visitante:'EGY', grupo:'G', pendiente:true },
  { id:52, fecha:'2026-06-25', hora:'15:00', sede:'Seattle', local:'BIH', visitante:'QAT', grupo:'G', pendiente:true },
  { id:60, fecha:'2026-06-27', hora:'22:00', sede:'Dallas', local:'JPN', visitante:'SWE', grupo:'G', pendiente:true },

  // Grupo H
  { id:13, fecha:'2026-06-14', hora:'18:00', sede:'Miami', local:'KSA', visitante:'URU', grupo:'H' },
  { id:14, fecha:'2026-06-15', hora:'12:00', sede:'Atlanta', local:'ESP', visitante:'CPV', grupo:'H' },
  { id:38, fecha:'2026-06-22', hora:'12:00', sede:'Atlanta', local:'ESP', visitante:'KSA', grupo:'H', pendiente:true },
  { id:43, fecha:'2026-06-23', hora:'13:00', sede:'Dallas', local:'ARG', visitante:'AUT', grupo:'H', pendiente:true },
  { id:53, fecha:'2026-06-25', hora:'21:00', sede:'CiudadMexico', local:'CZE', visitante:'MEX', grupo:'H', pendiente:true },
  { id:62, fecha:'2026-06-27', hora:'15:00', sede:'Miami', local:'SEN', visitante:'FRA', grupo:'H', pendiente:true },

  // Grupo I
  { id:17, fecha:'2026-06-16', hora:'15:00', sede:'NewYork', local:'FRA', visitante:'SEN', grupo:'I' },
  { id:18, fecha:'2026-06-16', hora:'18:00', sede:'Boston', local:'IRQ', visitante:'NOR', grupo:'I' },
  { id:41, fecha:'2026-06-23', hora:'20:00', sede:'Philadelphia', local:'NOR', visitante:'SEN', grupo:'I' },
  { id:42, fecha:'2026-06-23', hora:'17:00', sede:'Philadelphia', local:'FRA', visitante:'IRQ', grupo:'I', pendiente:true },
  { id:54, fecha:'2026-06-25', hora:'21:00', sede:'Monterrey', local:'RSA', visitante:'KOR', grupo:'I', pendiente:true },
  { id:61, fecha:'2026-06-27', hora:'15:00', sede:'Boston', local:'ENG', visitante:'GHA', grupo:'I', pendiente:true },

  // Grupo J
  { id:19, fecha:'2026-06-16', hora:'21:00', sede:'KansasCity', local:'ARG', visitante:'ALG', grupo:'J' },
  { id:20, fecha:'2026-06-17', hora:'00:00', sede:'SanFrancisco', local:'AUT', visitante:'JOR', grupo:'J' },
  { id:44, fecha:'2026-06-24', hora:'23:00', sede:'SanFrancisco', local:'JOR', visitante:'ALG', grupo:'J', pendiente:true },
  { id:45, fecha:'2026-06-24', hora:'16:00', sede:'Boston', local:'ENG', visitante:'PAN', grupo:'J', pendiente:true },
  { id:57, fecha:'2026-06-26', hora:'19:00', sede:'Dallas', local:'JPN', visitante:'NED', grupo:'J', pendiente:true },
  { id:63, fecha:'2026-06-27', hora:'23:00', sede:'Seattle', local:'EGY', visitante:'BEL', grupo:'J', pendiente:true },

  // Grupo K
  { id:23, fecha:'2026-06-17', hora:'13:00', sede:'Houston', local:'POR', visitante:'COD', grupo:'K' },
  { id:24, fecha:'2026-06-17', hora:'22:00', sede:'CiudadMexico', local:'UZB', visitante:'COL', grupo:'K' },
  { id:47, fecha:'2026-06-24', hora:'13:00', sede:'Houston', local:'POR', visitante:'UZB', grupo:'K', pendiente:true },
  { id:48, fecha:'2026-06-24', hora:'22:00', sede:'Guadalajara', local:'COL', visitante:'COD', grupo:'K', pendiente:true },
  { id:58, fecha:'2026-06-26', hora:'19:00', sede:'KansasCity', local:'TUN', visitante:'SWE', grupo:'K', pendiente:true },
  { id:64, fecha:'2026-06-27', hora:'23:00', sede:'Vancouver', local:'NZL', visitante:'CAN', grupo:'K', pendiente:true },

  // Grupo L
  { id:21, fecha:'2026-06-17', hora:'19:00', sede:'Toronto', local:'GHA', visitante:'PAN', grupo:'L' },
  { id:22, fecha:'2026-06-17', hora:'16:00', sede:'Dallas', local:'ENG', visitante:'CRO', grupo:'L' },
  { id:45, fecha:'2026-06-24', hora:'16:00', sede:'Boston', local:'ENG', visitante:'PAN', grupo:'L', pendiente:true },
  { id:46, fecha:'2026-06-24', hora:'19:00', sede:'Miami', local:'PAN', visitante:'CRO', grupo:'L', pendiente:true },
  { id:59, fecha:'2026-06-27', hora:'22:00', sede:'Dallas', local:'JPN', visitante:'NED', grupo:'L', pendiente:true },
  { id:60, fecha:'2026-06-27', hora:'22:00', sede:'Seattle', local:'BIH', visitante:'QAT', grupo:'L', pendiente:true },
]

const ELIMINATORIAS = [
  {
    ronda: 'Dieciseisavos de Final',
    rondaClave: 'r32',
    partidos: [
      { id:73,  fecha:'2026-06-28', hora:'23:00', sede:'Vancouver',   local:'1B', visitante:'3EFGIJ', label:'R32-1' },
      { id:74,  fecha:'2026-06-28', hora:'16:30', sede:'Boston',      local:'1E', visitante:'3ABCDF', label:'R32-2' },
      { id:75,  fecha:'2026-06-29', hora:'21:00', sede:'Monterrey',   local:'1F', visitante:'2C',     label:'R32-3' },
      { id:76,  fecha:'2026-06-29', hora:'17:00', sede:'NewYork',     local:'1I', visitante:'3CDFGH', label:'R32-4' },
      { id:77,  fecha:'2026-06-29', hora:'17:00', sede:'Philadelphia',local:'1K', visitante:'3ABCFG', label:'R32-5', pendiente:true },
      { id:78,  fecha:'2026-06-29', hora:'13:00', sede:'Dallas',      local:'2E', visitante:'2D',     label:'R32-6', pendiente:true },
      { id:79,  fecha:'2026-06-30', hora:'21:00', sede:'CiudadMexico', local:'1A', visitante:'3CEFHI', label:'R32-7' },
      { id:80,  fecha:'2026-06-30', hora:'12:00', sede:'Atlanta',     local:'1L', visitante:'3EHIJK', label:'R32-8' },
      { id:81,  fecha:'2026-07-01', hora:'20:00', sede:'SanFrancisco', local:'1D', visitante:'3BEFIJ', label:'R32-9' },
      { id:82,  fecha:'2026-07-01', hora:'16:00', sede:'Seattle',     local:'1G', visitante:'3AEHIJ', label:'R32-10' },
      { id:83,  fecha:'2026-07-01', hora:'19:00', sede:'Miami',       local:'1J', visitante:'2H',     label:'R32-11' },
      { id:84,  fecha:'2026-07-01', hora:'15:00', sede:'LosAngeles',  local:'1H', visitante:'2B',     label:'R32-12' },
      { id:85,  fecha:'2026-07-02', hora:'23:00', sede:'Vancouver',   local:'1B', visitante:'W85',    label:'R32-13', pendiente:true },
      { id:86,  fecha:'2026-07-02', hora:'18:00', sede:'Miami',       local:'1J', visitante:'2H',     label:'R32-14', pendiente:true },
      { id:87,  fecha:'2026-07-02', hora:'21:30', sede:'KansasCity',  local:'1K', visitante:'2J',     label:'R32-15', pendiente:true },
      { id:88,  fecha:'2026-07-02', hora:'14:00', sede:'Atlanta',     local:'2E', visitante:'2D',     label:'R32-16', pendiente:true },
    ]
  },
  {
    ronda: 'Octavos de Final',
    rondaClave: 'r16',
    partidos: [
      { id:89,  fecha:'2026-07-04', hora:'17:00', sede:'Philadelphia', local:'W74', visitante:'W77', label:'OCT-1' },
      { id:90,  fecha:'2026-07-04', hora:'13:00', sede:'Houston',      local:'W73', visitante:'W75', label:'OCT-2' },
      { id:91,  fecha:'2026-07-04', hora:'16:00', sede:'NewYork',      local:'W76', visitante:'W78', label:'OCT-3' },
      { id:92,  fecha:'2026-07-05', hora:'20:00', sede:'Miami',        local:'W79', visitante:'W80', label:'OCT-4' },
      { id:93,  fecha:'2026-07-05', hora:'15:00', sede:'Dallas',       local:'W81', visitante:'W82', label:'OCT-5' },
      { id:94,  fecha:'2026-07-06', hora:'20:00', sede:'Seattle',      local:'W83', visitante:'W84', label:'OCT-6' },
      { id:95,  fecha:'2026-07-06', hora:'12:00', sede:'Atlanta',      local:'W85', visitante:'W86', label:'OCT-7' },
      { id:96,  fecha:'2026-07-06', hora:'16:00', sede:'Vancouver',    local:'W87', visitante:'W88', label:'OCT-8' },
    ]
  },
  {
    ronda: 'Cuartos de Final',
    rondaClave: 'qf',
    partidos: [
      { id:97,  fecha:'2026-07-09', hora:'16:00', sede:'Boston',      local:'W89', visitante:'W90', label:'CF-1' },
      { id:98,  fecha:'2026-07-09', hora:'15:00', sede:'LosAngeles',   local:'W91', visitante:'W92', label:'CF-2' },
      { id:99,  fecha:'2026-07-10', hora:'17:00', sede:'Miami',        local:'W93', visitante:'W94', label:'CF-3' },
      { id:100, fecha:'2026-07-10', hora:'21:00', sede:'KansasCity',   local:'W95', visitante:'W96', label:'CF-4' },
    ]
  },
  {
    ronda: 'Semifinales',
    rondaClave: 'sf',
    partidos: [
      { id:101, fecha:'2026-07-14', hora:'15:00', sede:'Dallas',      local:'W97', visitante:'W98', label:'SF-1' },
      { id:102, fecha:'2026-07-15', hora:'15:00', sede:'Atlanta',      local:'W99', visitante:'W100', label:'SF-2' },
    ]
  },
  {
    ronda: 'Final de Bronce',
    rondaClave: '3rd',
    partidos: [
      { id:103, fecha:'2026-07-18', hora:'17:00', sede:'Miami',       local:'Perdedor SF1', visitante:'Perdedor SF2', label:'3°' },
    ]
  },
  {
    ronda: 'Final',
    rondaClave: 'final',
    partidos: [
      { id:104, fecha:'2026-07-19', hora:'15:00', sede:'NewYork',     local:'Ganador SF1', visitante:'Ganador SF2', label:'Final' },
    ]
  },
]

export { GRUPOS, PAISES, SEDES, PARTIDOS_FASE_GRUPOS, ELIMINATORIAS }
