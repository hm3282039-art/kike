import { assetId, petKey, variantName, type PetIndexEntry, type PetTier } from '../lib/ps99'
import { assetUrl } from '../lib/appUrl'

// Dated offline fallback only. These are recorded BIG Games RAP/exists figures,
// republished with all six variant columns by petsim99.co (sync: 2026-11-08 02:00 UTC).
// The live BIG Games API always replaces this limited snapshot when reachable.
export const PET_SNAPSHOT_AT = Date.parse('2026-11-08T02:00:00Z')
export const PET_SNAPSHOT_SOURCE = 'https://www.petsim99.co/rap'

type VariantRow = [pt: 0 | 1 | 2, sh: boolean, rap: number | null, exists: number | null]
type SnapshotBase = {
  id: string
  tier: Exclude<PetTier, 'Other'>
  thumbnail: string
  goldenThumbnail: string
  variants: VariantRow[]
}

const N = null
const bases: SnapshotBase[] = [
  {
    id: 'Gargantuan Doge', tier: 'Gargantuan', thumbnail: '91301167582038', goldenThumbnail: '71312806947825', variants: [
      [0, false, 166163795526, 59], [1, false, 187999800000, 13], [2, false, 40000000000, 3],
      [0, true, 850000000000, 2], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Gargantuan Evil Scarecrow Pumpkin', tier: 'Gargantuan', thumbnail: '114300365192444', goldenThumbnail: '106441871357793', variants: [
      [0, false, 131588146577, 128], [1, false, N, N], [2, false, N, N], [0, true, N, N], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Gargantuan Skelemelon', tier: 'Gargantuan', thumbnail: '116658660548384', goldenThumbnail: '117525933923587', variants: [
      [0, false, 107308074554, 112], [1, false, N, 10], [2, false, 1000000000000, 4],
      [0, true, N, N], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Titanic Arcane Cat', tier: 'Titanic', thumbnail: '18882936169', goldenThumbnail: '18882936384', variants: [
      [0, false, 44203658670, 238], [1, false, 28625049362, 126], [2, false, 74928961161, 63],
      [0, true, 213843600755, 96], [1, true, 53607051910, 49], [2, true, 118600000000, 25],
    ],
  },
  {
    id: 'Titanic Kitsune Fox', tier: 'Titanic', thumbnail: '18352469980', goldenThumbnail: '18352470225', variants: [
      [0, false, 17499149616, 467], [1, false, 12825727327, 137], [2, false, N, 40],
      [0, true, N, N], [1, true, 990000000000, 2], [2, true, N, N],
    ],
  },
  {
    id: 'Titanic Blue Balloon Cat', tier: 'Titanic', thumbnail: '14976589786', goldenThumbnail: '12292639155', variants: [
      [0, false, 28608909471, 876], [1, false, N, N], [2, false, 102096010240, 24],
      [0, true, N, 21], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Titanic Banana Cat', tier: 'Titanic', thumbnail: '15644507059', goldenThumbnail: '15644507241', variants: [
      [0, false, 16778950538, 1169], [1, false, N, N], [2, false, 78414648832, 25],
      [0, true, 23538928227, 14], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Titanic Hologram Cat', tier: 'Titanic', thumbnail: '14976631845', goldenThumbnail: '14977533986', variants: [
      [0, false, 23113947078, 810], [1, false, N, N], [2, false, N, N],
      [0, true, 94500000000, 19], [1, true, N, N], [2, true, N, N],
    ],
  },
  {
    id: 'Huge Amethyst Dragon', tier: 'Huge', thumbnail: '14976350251', goldenThumbnail: '14976350162', variants: [
      [0, false, 614836130, 8222], [1, false, N, N], [2, false, 3632265848, 188],
      [0, true, 1801926086, 187], [1, true, N, N], [2, true, 21074787200, 7],
    ],
  },
  {
    id: 'Huge Bread Shiba', tier: 'Huge', thumbnail: '14976370557', goldenThumbnail: '14976370393', variants: [
      [0, false, 9158310387, 785], [1, false, 8422769494, 99], [2, false, 19285601280, 28],
      [0, true, 24000000000, 14], [1, true, N, N], [2, true, N, 1],
    ],
  },
  {
    id: 'Huge Pumpkin Cat', tier: 'Huge', thumbnail: '14976529226', goldenThumbnail: '14976529068', variants: [
      [0, false, 655923222, 58629], [1, false, 538305982, 7912], [2, false, 2539578722, 3314],
      [0, true, 2330435403, 477], [1, true, 4332328852, 74], [2, true, 35600000000, 10],
    ],
  },
  {
    id: 'Huge Happy Rock', tier: 'Huge', thumbnail: '14976450873', goldenThumbnail: '14976450755', variants: [
      [0, false, 40358734, 845743], [1, false, 608257049, 1739], [2, false, 203584845, 26319],
      [0, true, 177371705, 1839], [1, true, N, N], [2, true, 2639885810, 105],
    ],
  },
  {
    id: 'Huge Chest Mimic', tier: 'Huge', thumbnail: '14976376935', goldenThumbnail: '14976376743', variants: [
      [0, false, 1764764857, 6187], [1, false, 1396174437, 694], [2, false, 9749604919, 158],
      [0, true, 9010931794, 62], [1, true, 1000000000000, 9], [2, true, 741000000, 5],
    ],
  },
  {
    id: 'Huge Autumn Chest Mimic', tier: 'Huge', thumbnail: '131920407611756', goldenThumbnail: '80724368653156', variants: [
      [0, false, 432279125, 2576], [1, false, 265644070, 701], [2, false, 1334692116, 211],
      [0, true, 11829134746, 13], [1, true, 25000000000, 4], [2, true, N, N],
    ],
  },
  {
    id: 'Huge Nightfall Pegasus', tier: 'Huge', thumbnail: '15260481050', goldenThumbnail: '15260481257', variants: [
      [0, false, 524393472, 14951], [1, false, 348431348, 1533], [2, false, 3445641172, 519],
      [0, true, 2667154485, 317], [1, true, 18568993894, 42], [2, true, 107222400000, 6],
    ],
  },
  {
    id: 'Huge Snowflake Pegasus', tier: 'Huge', thumbnail: '128323283709486', goldenThumbnail: '74842897410688', variants: [
      [0, false, 32747281, 384237], [1, false, 23036058, 23656], [2, false, 153563193, 14065],
      [0, true, 141404182, 7866], [1, true, 283977308, 467], [2, true, 908660599176, 298],
    ],
  },
  {
    id: 'Huge Rainbow Unicorn', tier: 'Huge', thumbnail: '14976532168', goldenThumbnail: '14976532056', variants: [
      [0, false, 651617350, 4564], [1, false, 694485928, 618], [2, false, 1922314599, 1760],
      [0, true, N, N], [1, true, N, N], [2, true, N, N],
    ],
  },
]

const exactArt: Record<string, string> = {
  [petKey('Gargantuan Doge', 1)]: 'golden-gargantuan-doge',
  [petKey('Gargantuan Doge', 0, true)]: 'shiny-gargantuan-doge',
  [petKey('Gargantuan Doge', 1, true)]: 'golden-shiny-gargantuan-doge',
  [petKey('Gargantuan Evil Scarecrow Pumpkin')]: 'gargantuan-evil-scarecrow-pumpkin',
  [petKey('Gargantuan Skelemelon', 2)]: 'rainbow-gargantuan-skelemelon',
  [petKey('Gargantuan Skelemelon', 2, true)]: 'rainbow-shiny-gargantuan-skelemelon',
  [petKey('Titanic Arcane Cat')]: 'titanic-arcane-cat',
  [petKey('Titanic Kitsune Fox')]: 'titanic-kitsune-fox',
  [petKey('Titanic Kitsune Fox', 1)]: 'golden-titanic-kitsune-fox',
  [petKey('Titanic Blue Balloon Cat', 2)]: 'rainbow-titanic-blue-balloon-cat',
  [petKey('Titanic Banana Cat', 0, true)]: 'shiny-titanic-banana-cat',
  [petKey('Titanic Hologram Cat', 0, true)]: 'shiny-titanic-hologram-cat',
  [petKey('Huge Amethyst Dragon')]: 'huge-amethyst-dragon',
  [petKey('Huge Bread Shiba')]: 'huge-bread-shiba',
  [petKey('Huge Pumpkin Cat')]: 'huge-pumpkin-cat',
  [petKey('Huge Happy Rock')]: 'huge-happy-rock',
  [petKey('Huge Happy Rock', 0, true)]: 'shiny-huge-happy-rock',
  [petKey('Huge Happy Rock', 1, true)]: 'golden-shiny-huge-happy-rock',
  [petKey('Huge Chest Mimic', 1)]: 'golden-huge-chest-mimic',
  [petKey('Huge Autumn Chest Mimic', 1, true)]: 'golden-shiny-huge-autumn-chest-mimic',
  [petKey('Huge Autumn Chest Mimic', 2, true)]: 'rainbow-shiny-huge-autumn-chest-mimic',
  [petKey('Huge Nightfall Pegasus', 2)]: 'rainbow-huge-nightfall-pegasus',
  [petKey('Huge Snowflake Pegasus', 2)]: 'rainbow-huge-snowflake-pegasus',
  [petKey('Huge Snowflake Pegasus', 2, true)]: 'rainbow-shiny-huge-snowflake-pegasus',
  [petKey('Huge Rainbow Unicorn')]: 'huge-rainbow-unicorn',
}

const localOfficialAssets = new Set(bases.flatMap((base) => [base.thumbnail, base.goldenThumbnail]))

export function localPetImage(entry: Pick<PetIndexEntry, 'key' | 'pt' | 'thumbnail' | 'goldenThumbnail'>) {
  const exact = exactArt[entry.key]
  if (exact) return assetUrl(`images/pets/${exact}.png`)
  const asset = assetId(entry.pt === 1 ? entry.goldenThumbnail : entry.thumbnail)
  return localOfficialAssets.has(asset) ? assetUrl(`images/pets/official/${asset}.png`) : ''
}

export const PET_SNAPSHOT: PetIndexEntry[] = bases.flatMap((base) => base.variants
  .filter(([pt, sh, rap, exists]) => (pt === 0 && !sh) || rap !== null || exists !== null)
  .map(([pt, sh, rap, exists]) => ({
    key: petKey(base.id, pt, sh),
    id: base.id,
    name: base.id,
    tier: base.tier,
    category: base.tier,
    pt,
    sh,
    variant: variantName(pt, sh),
    rap,
    exists,
    thumbnail: `rbxassetid://${base.thumbnail}`,
    goldenThumbnail: `rbxassetid://${base.goldenThumbnail}`,
  })))
