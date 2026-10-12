/**
 * Products that WordPress sold as one product per flavor, combined by 06-flavors into one product
 * with a `flavors[]` list and flavor + size variants. Numbers are WordPress ids (`legacy.wpId`);
 * the first one keeps its document `_id`, the others are archived and redirect to it.
 * Source: docs/FLAVOR-CANDIDATES.md (outside the repo).
 */
export type FlavorGroup = {
  title: string
  flavors: [wpId: number, name: string][]
  /** Label above the size buttons when it isn't "Size" */
  optionName?: string
  /** Rename size/pack labels after the general clean-up, e.g. { '3 lb Slider': '3 lb Sliders' } */
  options?: Record<string, string>
}

/** Flavor typed into the WooCommerce "size" attribute: split in place, no merge. */
export type FlavorFix = {
  wpId: number
  /** old option label → [flavor, size/pack] */
  split: Record<string, [flavor: string, option: string]>
  optionName?: string
}

export const FLAVOR_FIXES: FlavorFix[] = [
  {
    wpId: 6821,
    split: { Chicken: ['Chicken', '12oz'], Beef: ['Beef', '12oz'], Turkey: ['Turkey', '12oz'] }
  },
  {
    wpId: 6903,
    split: { Turkey: ['Turkey', '20oz'], Chicken: ['Chicken', '20oz'], Beef: ['Beef', '20oz'] }
  },
  {
    wpId: 7981,
    split: { Turkey: ['Turkey', '12oz'], Beef: ['Beef', '12oz'], Chicken: ['Chicken', '12oz'] }
  },
  {
    wpId: 9302,
    split: {
      'Venison 20oz': ['Venison', '20oz'],
      'Bison 20oz': ['Bison', '20oz'],
      'Duck 20oz': ['Duck', '20oz']
    }
  },
  {
    wpId: 9469,
    split: {
      Beef: ['Beef', 'Single'],
      Chicken: ['Chicken', 'Single'],
      Bison: ['Bison', 'Single'],
      Venison: ['Venison', 'Single']
    }
  },
  { wpId: 9474, split: { Beef: ['Beef', 'Single'] } },
  {
    wpId: 8848,
    split: {
      'Peanut Butter': ['Peanut Butter', 'Single'],
      'Bacon & Cheese': ['Bacon & Cheese', 'Single']
    }
  },
  ...[9595, 9603, 9611].map((wpId) => ({
    wpId,
    optionName: 'Firmness',
    split: Object.fromEntries(
      ['Hard', 'Medium', 'Soft'].flatMap((firmness) =>
        ['Classic', 'Beef'].map((flavor) => [`${firmness}-${flavor}`, [flavor, firmness]])
      )
    ) as FlavorFix['split']
  }))
]

const SLIDERS = { '3 lb Slider': '3 lb Sliders' }

export const FLAVOR_GROUPS: FlavorGroup[] = [
  // ------------------------------------------------------------------ wet food
  {
    title: 'NutriSource Canned Dog Food 13oz',
    flavors: [
      [6146, 'Chicken & Rice'],
      [8632, 'Lamb & Rice'],
      [8640, 'Beef & Rice'],
      [8644, 'Turkey & Rice'],
      [8648, 'Trout & Rice']
    ]
  },
  {
    title: 'NutriSource Grain Free Canned Dog Food 13oz',
    flavors: [
      [8652, 'Northern Feast'],
      [8656, "Hunter's Bounty"],
      [8660, 'Field & Forest']
    ]
  },
  {
    title: 'Weruva Canned Dog Food',
    flavors: [
      [9779, "Paw Lickin' Chicken"],
      [9785, 'Steak Frites'],
      [9791, 'Wok the Dog'],
      [9798, 'Bed & Breakfast'],
      [9802, "Grandma's Chicken Soup"],
      [9808, "Amazon Livin'"],
      [9814, 'Cirque de la Mer'],
      [9818, 'Peking Duck'],
      [9822, 'Hot Dayam!'],
      [9826, 'Green Eggs & Chicken']
    ]
  },
  {
    title: 'Weruva Awesome Canned Dog Food 14oz',
    flavors: [
      [9834, 'Belly (Chicken, Rice & Pumpkin)'],
      [9838, 'Shiny (Beef & Brown Rice)'],
      [9869, 'Bouncy (Chicken & Riceberry)']
    ]
  },
  {
    title: 'Weruva BFF Wet Cat Food',
    flavors: [
      [5111, 'Sweet Cheeks (Tuna & Salmon)'],
      [5115, 'Devour Me (Tuna & Duck)'],
      [6176, 'Valentine (Tuna & Pumpkin)']
    ]
  },
  {
    title: 'Fussie Cat Premium in Aspic 2.82oz',
    flavors: [
      [4683, 'Tuna'],
      [4692, 'Tuna & Chicken'],
      [4700, 'Tuna & Chicken Liver'],
      [4704, 'Tuna & Salmon'],
      [4687, 'Tuna & Shrimp'],
      [4696, 'Tuna & Mussels']
    ]
  },
  {
    title: 'Nulo Freestyle Canned Dog Food 13oz',
    flavors: [
      [6872, 'Chicken, Carrots & Peas'],
      [6884, 'Beef, Peas & Carrots'],
      [5734, 'Turkey & Sweet Potato'],
      [6888, 'Lamb & Lentil']
    ]
  },
  {
    title: "Evanger's Classic Canned Dog Food 12.5oz",
    flavors: [
      [9936, 'Cooked Chicken'],
      [9940, 'Cooked Beef'],
      [9932, 'Lamb & Rice Dinner']
    ]
  },
  {
    title: 'Natural Farm Canned Dog Food 12.8oz',
    flavors: [
      [10020, 'Red Meat'],
      [10025, 'Poultry']
    ]
  },
  {
    title: 'NutriSource Choice Canned Dog Food 12.3oz',
    flavors: [
      [9394, 'Beef & Barley'],
      [9398, 'Chicken & Barley'],
      [9402, 'Turkey & Barley']
    ]
  },
  {
    title: 'Open Farm Rustic Stew 12.5oz',
    flavors: [
      [7935, 'Grass-Fed Beef'],
      [7977, 'Chicken & Salmon']
    ]
  },
  {
    title: 'Merrick Grain Free Canned Dog Food',
    flavors: [
      [4943, 'Turducken'],
      [4946, 'Thanksgiving Day Dinner'],
      [4962, 'Smothered Comfort'],
      [4965, "Grammy's Pot Pie"],
      [4968, 'Cowboy Cookout'],
      [4978, 'Chunky Carvers Delight'],
      [4981, 'Chunky Big Texas Steak Tips']
    ]
  },
  {
    title: 'Merrick Grain Free Puppy Plate in Gravy',
    flavors: [
      [4950, 'Chicken'],
      [4953, 'Beef']
    ]
  },
  {
    title: 'Zignature Limited Ingredient Canned Dog Food 13oz',
    flavors: [
      [1080, 'Duck'],
      [1097, 'Turkey'],
      [4802, 'Salmon'],
      [8275, 'Pork']
    ]
  },
  {
    title: 'Nulo Cat Canned Food 5.5oz',
    flavors: [
      [4387, 'Turkey & Chicken'],
      [4393, 'Chicken & Herring'],
      [6896, 'Salmon & Mackerel'],
      [6899, 'Trout & Salmon']
    ]
  },
  {
    title: 'Nulo Pouch 2.8oz',
    flavors: [
      [3917, 'Chicken, Duck & Kale'],
      [3921, 'Beef, Beef Liver & Kale']
    ]
  },
  // ------------------------------------------------------------------ dry food
  {
    title: 'Zignature Limited Ingredient Dry Dog Food',
    flavors: [
      [1084, 'Kangaroo'],
      [1093, 'Salmon'],
      [3239, 'Turkey'],
      [3244, 'Duck'],
      [3250, 'Pork'],
      [3256, 'Lamb'],
      [2515, 'Goat']
    ]
  },
  {
    title: 'Zignature Small Breed Dry Dog Food',
    flavors: [
      [4815, 'Turkey'],
      [4819, 'Trout & Salmon'],
      [5288, 'Kangaroo']
    ]
  },
  {
    title: 'ACANA Singles Dry Dog Food',
    flavors: [
      [1419, 'Lamb & Apple'],
      [8526, 'Beef & Pumpkin'],
      [63, 'Duck & Pear']
    ]
  },
  {
    title: 'NutriSource Choice Dry Dog Food',
    flavors: [
      [9365, 'Beef & Barley'],
      [9376, 'Chicken & Barley'],
      [9380, 'Whitefish & Rice'],
      [9384, 'Turkey & Barley']
    ]
  },
  {
    title: 'NutriSource Choice Large Breed Dry Dog Food',
    flavors: [
      [9388, 'Chicken & Barley'],
      [9391, 'Beef & Barley']
    ]
  },
  {
    title: 'Nulo Freestyle Grain-Free Adult Dry Dog Food',
    flavors: [
      [2484, 'Salmon & Peas'],
      [2489, 'Turkey & Sweet Potato']
    ]
  },
  {
    title: 'Nulo Freestyle Limited Ingredient Dry Dog Food',
    flavors: [
      [5710, 'Turkey'],
      [5720, 'Salmon']
    ]
  },
  {
    title: 'Nulo Freestyle Grain-Free Puppy Dry Dog Food',
    flavors: [
      [2471, 'Turkey & Sweet Potato'],
      [5725, 'Salmon & Peas']
    ]
  },
  {
    title: 'Nulo Freestyle Cat & Kitten Grain-Free Dry Food',
    flavors: [
      [5079, 'Chicken & Cod'],
      [5083, 'Turkey & Duck']
    ]
  },
  {
    title: 'Natural Farm Fresh from the Farm Dry Dog Food',
    flavors: [
      [10002, 'Fish'],
      [10007, 'Red Meat'],
      [10012, 'Poultry']
    ]
  },
  {
    title: 'The Honest Kitchen Clusters',
    flavors: [
      [3945, 'Chicken'],
      [3951, 'Beef'],
      [3955, 'Turkey']
    ]
  },
  {
    title: 'The Honest Kitchen Grain Free Dehydrated Dog Food',
    flavors: [
      [1165, 'Chicken'],
      [1176, 'Beef']
    ]
  },
  {
    title: 'Diamond Naturals Grain-Free Dry Dog Food',
    flavors: [
      [894, 'Chicken & Sweet Potato'],
      [897, 'Whitefish & Sweet Potato']
    ]
  },
  {
    title: 'Inception Dry Dog Food',
    flavors: [
      [4735, 'Chicken'],
      [4738, 'Pork'],
      [4741, 'Fish'],
      [4744, 'Chicken & Pork']
    ]
  },
  {
    title: 'Firstmate Dry Dog Food',
    flavors: [
      [4843, 'Free Range Lamb & Oats'],
      [4865, 'Duck & Oats']
    ]
  },
  {
    title: "Grandma Lucy's Artisan Grain-Free Dog Food",
    flavors: [
      [836, 'Chicken'],
      [839, 'Pork']
    ]
  },
  // ------------------------------------------------------------------ raw, freeze-dried, cooked
  {
    title: 'Answers Raw Goat Cheese 8oz',
    options: { Tumeric: '8 oz', Blueberry: '8 oz' },
    flavors: [
      [4463, 'Turmeric'],
      [4477, 'Blueberry']
    ]
  },
  {
    title: 'Primal Freeze-Dried Nuggets',
    flavors: [
      [1501, 'Chicken'],
      [1504, 'Beef'],
      [1507, 'Lamb'],
      [1510, 'Turkey & Sardine']
    ]
  },
  {
    title: 'Primal Kibble in the Raw',
    flavors: [
      [7832, 'Beef'],
      [7836, 'Chicken'],
      [7840, 'Fish & Pork']
    ]
  },
  {
    title: 'Primal Pronto Frozen Raw',
    flavors: [
      [4882, 'Chicken'],
      [4885, 'Turkey & Sardine'],
      [4888, 'Lamb'],
      [4894, 'Pork']
    ]
  },
  {
    title: 'Primal Frozen Raw Nuggets',
    flavors: [
      [2433, 'Chicken'],
      [4903, 'Pork']
    ]
  },
  {
    title: 'Primal Frozen Raw Patties',
    flavors: [
      [2428, 'Chicken'],
      [4906, 'Pork'],
      [1205, 'Lamb'],
      [1254, 'Beef']
    ]
  },
  {
    title: 'Primal Bone Broth 20oz',
    flavors: [
      [4918, 'Beef'],
      [4921, 'Chicken'],
      [4924, 'Turkey']
    ]
  },
  {
    title: 'Smallbatch Frozen Raw',
    options: SLIDERS,
    flavors: [
      [5533, 'Chicken'],
      [5538, 'Beef'],
      [8981, 'Turkey'],
      [8986, 'Pork'],
      [8992, 'Lamb'],
      [8997, 'Duck'],
      [9002, 'Rabbit']
    ]
  },
  {
    title: 'Smallbatch Freeze-Dried',
    flavors: [
      [9339, 'Beef'],
      [9346, 'Chicken'],
      [9350, 'Turkey'],
      [9354, 'Duck'],
      [9358, 'Lamb'],
      [9362, 'Pork']
    ]
  },
  {
    title: 'Smallbatch Lightly Cooked Frozen',
    flavors: [
      [5588, 'Chicken'],
      [5595, 'Beef'],
      [5599, 'Turkey'],
      [9256, 'Pork'],
      [9260, 'Lamb']
    ]
  },
  {
    title: 'Smallbatch Cat Sliders',
    flavors: [
      [7166, 'Beef'],
      [9006, 'Chicken'],
      [9012, 'Rabbit'],
      [9015, 'Turkey']
    ]
  },
  {
    title: 'Smallbatch Cat Perfectly Cooked Sliders',
    flavors: [
      [9880, 'Turkey'],
      [9883, 'Chicken'],
      [9891, 'Beef']
    ]
  },
  {
    title: 'Smallbatch Freeze-Dried Boosters 7oz',
    flavors: [
      [5527, 'Chicken'],
      [5530, 'Beef'],
      [10232, 'Turkey'],
      [10235, 'Pork'],
      [10238, 'Lamb'],
      [10243, 'Duck']
    ]
  },
  {
    title: 'Smallbatch Freeze-Dried Hearts 3.5oz',
    flavors: [
      [5512, 'Chicken'],
      [5515, 'Beef'],
      [5518, 'Lamb'],
      [5521, 'Turkey'],
      [5524, 'Pork']
    ]
  },
  {
    title: 'Raw Dynamic Gently Cooked',
    flavors: [
      [10177, 'Chicken'],
      [10181, 'Beef'],
      [10185, 'Turkey'],
      [10189, 'Lamb'],
      [10192, 'Duck'],
      [10195, 'Rabbit']
    ]
  },
  {
    title: 'Raw Dynamic Frozen Raw',
    flavors: [
      [10068, 'Beef'],
      [10199, 'Chicken']
    ]
  },
  {
    title: 'Answers Detailed Raw',
    flavors: [
      [4558, 'Beef'],
      [4517, 'Chicken'],
      [4597, 'Pork'],
      [4601, 'Turkey']
    ]
  },
  {
    title: 'Green Juju Freeze-Dried Raw 14oz',
    flavors: [
      [8173, 'Grass-Fed Beef'],
      [8169, 'Grass-Fed Bison'],
      [8176, 'Grass-Fed Goat'],
      [8179, 'Grass-Fed Lamb']
    ]
  },
  {
    title: 'Green Juju Frozen Raw',
    flavors: [
      [8146, 'Grass-Fed Beef'],
      [8150, 'Grass-Fed Goat'],
      [8154, 'Grass-Fed Lamb']
    ]
  },
  {
    title: 'MuttGut Raw',
    flavors: [
      [9727, 'Chicken'],
      [9732, 'Pork'],
      [9737, 'Beef']
    ]
  },
  {
    title: 'OC Raw Patties 18lb Bulk Box',
    flavors: [
      [9173, 'Beef & Produce'],
      [9181, 'Chicken & Produce'],
      [9187, 'Turkey & Produce'],
      [9190, 'Duck & Produce']
    ]
  },
  {
    title: 'OC Raw Meaty Rox 7lb',
    flavors: [
      [8039, 'Beef & Produce'],
      [9169, 'Chicken & Produce']
    ]
  },
  {
    title: 'Open Farm Gently Cooked 16oz',
    flavors: [
      [5207, 'Beef'],
      [5212, 'Chicken'],
      [5217, 'Surf & Turf'],
      [5222, 'Turkey']
    ]
  },
  {
    title: 'Northwest Naturals Freeze-Dried Raw Nuggets',
    flavors: [
      [10284, 'Chicken'],
      [5561, 'Beef'],
      [5564, 'Lamb']
    ]
  },
  {
    title: 'Northwest Naturals Frozen Raw 6lb',
    flavors: [
      [5567, 'Chicken & Salmon'],
      [5570, 'Whitefish & Salmon']
    ]
  },
  {
    title: 'The Real Meat Company 90% Air-Dried Dog Food',
    flavors: [
      [1120, 'Beef'],
      [1123, 'Chicken'],
      [1126, 'Lamb']
    ]
  },
  {
    title: 'Fussie Cat Market Fresh Dry Cat Food',
    flavors: [
      [4796, 'Salmon & Chicken'],
      [4729, 'Salmon'],
      [4799, 'Chicken & Turkey']
    ]
  },
  {
    title: 'Savage Cat Tub',
    flavors: [
      [9020, 'Chicken'],
      [9024, 'Rabbit & Lamb'],
      [9028, 'Duck']
    ]
  },
  {
    title: 'Earth Animal Wisdom Air-Dried Dog Food 2lb',
    flavors: [
      [8047, 'Turkey'],
      [8050, 'Chicken']
    ]
  },
  {
    title: 'S&C Raw Coated',
    flavors: [
      [1189, 'Beef'],
      [1191, 'Chicken']
    ]
  },
  // ------------------------------------------------------------------ treats and chews
  {
    title: 'Earth Animal No-Hide Stix 10 Pack',
    flavors: [
      [4534, 'Peanut Butter'],
      [4538, 'Chicken'],
      [4542, 'Salmon'],
      [4546, 'Pork'],
      [4550, 'Beef'],
      [4554, 'Venison']
    ]
  },
  {
    title: 'Earth Animal No-Hide Chews',
    flavors: [
      [1975, 'Beef'],
      [1980, 'Salmon'],
      [1985, 'Pork'],
      [4523, 'Peanut Butter'],
      [4528, 'Venison']
    ]
  },
  {
    title: 'Nulo Jerky 5oz',
    flavors: [
      [6921, 'Turkey'],
      [6925, 'Chicken'],
      [6928, 'Duck'],
      [6932, 'Salmon'],
      [6935, 'Beef']
    ]
  },
  {
    title: 'Nulo Trainers',
    flavors: [
      [6908, 'Turkey'],
      [6912, 'Duck'],
      [6916, 'Salmon']
    ]
  },
  {
    title: 'NutriSource Little Bites Treats 6oz',
    flavors: [
      [8603, 'Chicken'],
      [8605, 'Rabbit'],
      [8607, 'Duck'],
      [8609, 'Peanut Butter'],
      [8611, 'Beef']
    ]
  },
  {
    title: 'NutriSource Big Bites Treats 14oz',
    flavors: [
      [8594, 'Chicken'],
      [8596, 'Beef']
    ]
  },
  {
    title: 'PupCup Whipped Treat 13oz',
    flavors: [
      [10204, 'Original'],
      [10264, 'Bacon'],
      [10268, 'Chicken'],
      [10298, 'Peanut Butter'],
      [10301, 'Pumpkin']
    ]
  },
  {
    title: 'Plaque Off Dental Bones 13 Count',
    flavors: [
      [5300, 'Vegetable'],
      [5303, 'Bacon'],
      [5306, 'Chicken & Pumpkin'],
      [5309, 'Turkey & Cranberry']
    ]
  },
  {
    title: "Grandma Lucy's Organic Oven Baked Dog Treats 14oz",
    flavors: [
      [1681, 'Blueberry'],
      [1684, 'Banana & Sweet Potato'],
      [1687, 'Apple'],
      [1690, 'Pumpkin']
    ]
  },
  {
    title: 'Natural Farm Filled Bone',
    flavors: [
      [8835, 'Sweet Potato'],
      [8839, 'Bacon & Cheese'],
      [8843, 'Peanut Butter']
    ]
  },
  {
    title: 'Natural Farm Filled Beef Cheek Roll',
    flavors: [
      [8919, 'Chicken'],
      [8923, 'Peanut Butter']
    ]
  },
  {
    title: 'Green Juju Trainer Treats 2.5oz',
    flavors: [
      [9308, 'Bison Liver'],
      [9311, 'Rabbit']
    ]
  },
  {
    title: 'The Honest Kitchen Instant Bone Broth 3.6oz',
    flavors: [
      [5613, 'Turkey & Turmeric'],
      [5616, 'Beef & Turmeric']
    ]
  },
  {
    title: "Stella & Chewy's Grass-Fed Wild Weenies 3.25oz",
    flavors: [
      [5760, 'Lamb'],
      [5766, 'Beef']
    ]
  },
  {
    title: 'The Bear and The Rat Froyo 4 Pack',
    flavors: [
      [5124, 'Bacon & Peanut Butter'],
      [5128, 'Banana & Peanut Butter']
    ]
  },
  {
    title: 'Woof Pupsicle Refill Pops',
    flavors: [
      [8278, 'Chicken & Peanut Butter'],
      [8285, 'Beef & Peanut Butter']
    ]
  },
  {
    title: 'Zignature Grain Free Ziggy Bars 12oz',
    flavors: [
      [5291, 'Turkey'],
      [5297, 'Trout & Salmon']
    ]
  },
  {
    title: 'Vital Essentials Freeze-Dried Bites 2oz',
    flavors: [
      [1886, 'Rabbit'],
      [1905, 'Duck']
    ]
  },
  {
    title: 'Vital Essentials Freeze-Dried Necks',
    optionName: 'Pack',
    flavors: [
      [4623, 'Turkey'],
      [4627, 'Chicken'],
      [4631, 'Duck']
    ]
  },
  {
    title: 'Northwest Naturals Raw Frozen Necks',
    optionName: 'Pack',
    flavors: [
      [5578, 'Chicken'],
      [5582, 'Turkey'],
      [5585, 'Duck']
    ]
  },
  {
    title: 'Greenies Pill Pockets 60 Count',
    flavors: [
      [5254, 'Hickory Smoke'],
      [5258, 'Chicken']
    ]
  }
]
