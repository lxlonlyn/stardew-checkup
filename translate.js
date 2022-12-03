// Translate dict
// 标题
const translateTitleMap = new Map([
    ["Summary", "概括"],
    ["Money", "金钱"],
    ["Skills", "技能"],
    ["Quests", "任务"],
    ["Monster Hunting", "怪物狩猎"],
    ["Stardrops", "星之果实"],
    ["Home and Family", "住所与家庭"],
    ["Social", "社交"],
    ["Cooking", "烹饪"],
    ["Crafting", "制作"],
    ["Fishing", "钓鱼"],
    ["Basic Shipping", "售卖"],
    ["Crop Shipping", "农作物售卖"],
    ["Museum Collection", "博物馆收集"],
    ["Secret Notes", "秘密纸条"],
    ["Community Center / Joja Community Development", "社区中心收集 / Joja社区开发"],
    ["Grandpa's Evaluation", "爷爷的评估"],
    ["Special Orders", "特殊订单"],
    ["Journal Scraps", "日记残页"],
    ["Golden Walnuts", "金色核桃"],
    ["Island Upgrades", "姜岛升级"],
    ["Perfection Tracker", "完美度追踪器"]
]);
// 农场类型
const translateFarmTypeMap = new Map([
    ["Standard", "标准农场"],
    ["Riverland", "河边农场"],
    ["Forest", "森林农场"],
    ["Hill-top", "山顶农场"],
    ["Wilderness", "荒野农场"],
    ["Four Corners", "四角农场"],
    ["Beach", "海滩农场"]
]);
// 季节
const translateSeasonMap = new Map([
    ["Spring", "春季"],
    ["Summer", "夏季"],
    ["Autumn", "秋季"],
    ["Fall", "秋季"],
    ["Winter", "冬季"]
])
// 技能类
const translateSkillMap = new Map([
    ["Farming", "耕种"],
    ["Fishing", "钓鱼"],
    ["Foraging", "觅食"],
    ["Mining", "采矿"],
    ["Combat", "战斗"]
]);
// 怪物
const translateMonsterMap = new Map([
    // 矿井
    ["Bats", "蝙蝠"],
    ["Bat", "普通蝙蝠"],
    ["Frost Bat", "冰冻蝙蝠"],
    ["Lava Bat", "熔岩蝙蝠"],
    ["Iridium Bat", "铱蝠"],
    ["Bug", "臭虫"],
    ["Cave Fly", "洞穴蝇"],
    ["Duggy", "掘地虫"],
    ["Dust Sprite", "灰尘精灵"],
    ["Dust Sprites", "灰尘精灵"],
    ["Dust Spirit", "灰尘精灵"],
    ["Ghost", "幽灵"],
    ["Grub", "蛆"],
    ["Lava Crab", "熔岩蟹"],
    ["Metal Head", "金属大头"],
    ["Rock Crab", "岩石蟹"],
    ["Rock Crabs", "岩石蟹"],
    ["Shadow Brute", "暗影狂徒"],
    ["Shadow Shaman", "暗影萨满"],
    ["Skeleton", "骷髅"],
    ["Skeletons", "骷髅"],
    ["Slimes", "史莱姆"],
    ["Green Slime", "绿色史莱姆"],
    ["Frost Jelly", "冰霜史莱姆"],
    ["Sludge", "岩浆史莱姆"],
    ["Squid Kid", "鱿鱼娃"],
    ["Stone Golem", "石魔"],

    // 危险的矿井
    ["Blue Squid", "蓝鱿鱼"],
    ["Skeleton Mage", "骷髅法师"],
    ["Spider", "蜘蛛"],
    ["Shadow Sniper", "暗影狙击手"],
    ["Putrid Ghost", "腐臭幽灵"],

    // 采石场
    ["Copper Slime", "铜史莱姆"],
    ["Haunted Skull", "幽灵头骨"],
    ["Iron Slime", "铁史莱姆"],

    // 头骨山洞
    ["Armored Bug", "甲虫"],
    ["Big Slime", "大史莱姆"],
    ["Carbon Ghost", "石炭幽灵"],
    // ["Iridium Bat", "铱蝠"],
    ["Iridium Crab", "铱蟹"],
    // ["Lava Bat", "熔岩蝙蝠"], 定义在矿井-蝙蝠
    ["Mummy", "木乃伊"],
    ["Mummies", "木乃伊"],
    ["Pepper Rex", "霸王喷火龙"],
    ["Purple Slime", "紫色史莱姆"],
    ["Serpent", "飞蛇"],
    ["Serpents", "飞蛇"],

    // 危险的头骨山洞
    ["Royal Serpent", "皇家飞蛇"],

    // 突变洞穴
    ["Mutant Fly", "突变蝇"],
    ["Mutant Grub", "突变蛆"],

    // 荒野农场
    ["Wilderness Golem", "荒野石魔"],

    // 火山
    ["Dwarvish Sentry", "矮人哨兵"],
    ["False Magma Cap", "假熔岩菇"],
    ["Hot Head", "熔岩大头"],
    ["Lava Lurk", "熔岩潜伏怪"],
    ["Magma Duggy", "熔岩掘地虫"],
    ["Magma Sparker", "熔岩火球"],
    ["Magma Sprite", "熔岩精灵"],
    ["Tiger Slime", "老虎史莱姆"],

    // 讨伐目标
    ["Cave Insects", "山洞昆虫"],
    ["Duggies", "掘地虫"],
    ["Flame Spirits", "火焰精灵"],
    ["Void Spirits", "虚空之灵"]
]);
// 村民
const translateVillagerMap = new Map([
    ["Alex", "亚历克斯"],
    ["Elliott", "艾利欧特"],
    ["Harvey", "哈维"],
    ["Sam", "山姆"],
    ["Sebastian", "塞巴斯蒂安"],
    ["Shane", "谢恩"],
    ["Abigail", "阿比盖尔"],
    ["Emily", "艾米丽"],
    ["Haley", "海莉"],
    ["Leah", "莉雅"],
    ["Maru", "玛鲁"],
    ["Penny", "潘妮"],
    ["Caroline", "卡洛琳"],
    ["Clint", "克林特"],
    ["Demetrius", "德米特里厄斯"],
    ["Evelyn", "艾芙琳"],
    ["George", "乔治"],
    ["Gil", "吉尔"],
    ["Gunther", "冈瑟"],
    ["Gus", "格斯"],
    ["Jas", "贾斯"],
    ["Jodi", "乔迪"],
    ["Kent", "肯特"],
    ["Lewis", "刘易斯"],
    ["Linus", "莱纳斯"],
    ["Marlon", "马龙"],
    ["Marnie", "玛妮"],
    ["Morris", "莫里斯"],
    ["Pam", "潘姆"],
    ["Pierre", "皮埃尔"],
    ["Robin", "罗宾"],
    ["Vincent", "文森特"],
    ["Willy", "威利"],
    ["Birdie", "贝啼"],
    ["Bouncer", "门卫"],
    ["Dwarf", "矮人"],
    ["Governor", "州长"],
    ["Grandpa", "爷爷"],
    ["Henchman", "仆人"],
    ["Junimos", "祝尼魔"],
    ["Krobus", "科罗布斯"],
    ["Leo", "雷欧"],
    ["Mr. Qi", "齐先生"],
    ["Old Mariner", "老水手"],
    ["Professor Snail", "蜗牛教授"],
    ["Sandy", "桑迪"],
    ["Wizard", "法师"]
]);
// 鱼
const translateFishMap = new Map([
    // 传说
    ["Angler", "鮟鱇鱼"],
    ["Crimsonfish", "绯红鱼"],
    ["Glacierfish", "冰川鱼"],
    ["Glacierfish Jr.", "小冰川鱼"],
    ["Legend", "传说之鱼"],
    ["Legend II", "传说之鱼二代"],
    ["Ms. Angler", "雌鮟鱇鱼"],
    ["Mutant Carp", "变种鲤鱼"],
    ["Radioactive Carp", "放射性鲤鱼"],
    ["Son of Crimsonfish", "绯红鱼之子"],
    // 海边
    ["Albacore", "青花鱼"],
    ["Anchovy", "鳀鱼"],
    ["Eel", "鳗鱼"],
    ["Flounder", "比目鱼"],
    ["Halibut", "大比目鱼"],
    ["Herring", "鲱鱼"],
    ["Octopus", "章鱼"],
    ["Pufferfish", "河豚"],
    ["Red Mullet", "红鲻鱼"],
    ["Red Snapper", "红鲷鱼"],
    ["Sardine", "沙丁鱼"],
    ["Sea Cucumber", "海参"],
    ["Squid", "鱿鱼"],
    ["Super Cucumber", "大海参"],
    ["Tilapia", "罗非鱼"],
    ["Tuna", "金枪鱼"],
    // 河鱼
    ["Bream", "鲷鱼"],
    ["Catfish", "鲶鱼"],
    ["Chub", "鲢鱼"],
    ["Dorado", "麻哈脂鲤"],
    ["Lingcod", "蛇齿单线鱼"],
    ["Perch", "河鲈"],
    ["Pike", "狗鱼"],
    ["Rainbow Trout", "虹鳟鱼"],
    ["Salmon", "鲑鱼"],
    ["Shad", "西鲱"],
    ["Smallmouth Bass", "小嘴鲈鱼"],
    ["Sunfish", "太阳鱼"],
    ["Tiger Trout", "虎纹鳟鱼"],
    ["Walleye", "大眼鱼"],
    // 山间湖泊
    ["Bullhead", "大头鱼"],
    ["Carp", "鲤鱼"],
    ["Largemouth Bass", "大嘴鲈鱼"],
    ["Midnight Carp", "午夜鲤鱼"],
    ["Sturgeon", "鲟鱼"],
    // 偏远森林
    // 秘密森林
    ["Woodskip", "木跃鱼"],
    // 矿井
    ["Ghostfish", "鬼鱼"],
    ["Ice Pip", "冰柱鱼"],
    ["Lava Eel", "岩浆鳗鱼"],
    ["Stonefish", "石鱼"],
    // 下水道
    // 沙漠
    ["Sandfish", "沙鱼"],
    ["Scorpion Carp", "蝎鲤鱼"],
    // 突变虫穴
    ["Slimejack", "史莱姆鱼"],
    // 女巫
    ["Void Salmon", "虚空鲑鱼"],
    // 夜市
    ["Blobfish", "水滴鱼"],
    ["Midnight Squid", "午夜鱿鱼"],
    ["Spook Fish", "幽灵鱼"],
    // 蟹笼
    ["Clam", "蛤"],
    ["Cockle", "鸟蛤"],
    ["Crab", "螃蟹"],
    ["Crayfish", "小龙虾"],
    ["Lobster", "龙虾"],
    ["Mussel", "蚌"],
    ["Oyster", "牡蛎"],
    ["Periwinkle", "玉黍螺"],
    ["Shrimp", "虾"],
    ["Snail", "蜗牛"],
    // 姜岛
    ["Blue Discus", "蓝铁饼鱼"],
    ["Lionfish", "狮子鱼"],
    ["Stingray", "黄貂鱼"],
    // 其他
    ["White Algae", "白藻"],
    ["Green Algae", "绿藻"],
    ["Seaweed", "海草"]
]);
// 售卖物品
const translateShippableItemMap = new Map([
    ["Wild Horseradish", "野山葵"],
    ["Daffodil", "黄水仙"],
    ["Leek", "韭葱"],
    ["Dandelion", "蒲公英"],
    ["Parsnip", "防风草"],
    ["Cave Carrot", "山洞萝卜"],
    ["Coconut", "椰子"],
    ["Cactus Fruit", "仙人掌果子"],
    ["Banana", "香蕉"],
    ["Sap", "树液"],
    ["Large Egg (white)", "大鸡蛋（白色）"],
    ["Large Egg (White)", "大鸡蛋（白色）"],
    ["Large Egg", "大鸡蛋"],
    ["Egg (white)", "蛋（白色）"],
    ["Egg (White)", "蛋（白色）"],
    ["Egg (brown)", "蛋（棕色）"],
    ["Egg (Brown)", "蛋（棕色）"],
    ["Egg", "蛋"],
    ["Large Egg (brown)", "大鸡蛋（棕色）"],
    ["Large Egg (Brown)", "大鸡蛋（棕色）"],
    ["Milk", "牛奶"],
    ["Large Milk", "大壶牛奶"],
    ["Green Bean", "青豆"],
    ["Cauliflower", "花椰菜"],
    ["Potato", "土豆"],
    ["Garlic", "蒜"],
    ["Kale", "甘蓝菜"],
    ["Rhubarb", "大黄"],
    ["Melon", "甜瓜"],
    ["Tomato", "西红柿"],
    ["Morel", "羊肚菌"],
    ["Blueberry", "蓝莓"],
    ["Fiddlehead Fern", "蕨菜"],
    ["Hot Pepper", "辣椒"],
    ["Wheat", "小麦"],
    ["Radish", "萝卜"],
    ["Red Cabbage", "红叶卷心菜"],
    ["Starfruit", "杨桃"],
    ["Corn", "玉米"],
    ["Unmilled Rice", "未碾米"],
    ["Eggplant", "茄子"],
    ["Artichoke", "洋蓟"],
    ["Pumpkin", "南瓜"],
    ["Bok Choy", "小白菜"],
    ["Yam", "山药"],
    ["Chanterelle", "鸡油菌"],
    ["Cranberries", "蔓越莓"],
    ["Holly", "冬青树"],
    ["Beet", "甜菜"],
    ["Ostrich Egg", "鸵鸟蛋"],
    ["Salmonberry", "美洲大树莓"],
    ["Amaranth", "苋菜"],
    ["Pale Ale", "淡啤酒"],
    ["Hops", "啤酒花"],
    ["Void Egg", "虚空蛋"],
    ["Mayonnaise", "蛋黄酱"],
    ["Duck Mayonnaise", "鸭蛋黄酱"],
    ["Void Mayonnaise", "虚空蛋黄酱"],
    ["Clay", "粘土"],
    ["Copper Bar", "铜锭"],
    ["Iron Bar", "铁锭"],
    ["Gold Bar", "金锭"],
    ["Iridium Bar", "铱锭"],
    ["Refined Quartz", "精炼石英"],
    ["Honey (any)", "蜂蜜（任何类型）"],
    ["Honey", "蜂蜜"],
    ["Pickles (any)", "腌菜（任何类型）"],
    ["Pickles", "腌菜"],
    ["Jelly (any)", "果酱（任何类型）"],
    ["Jelly", "果酱"],
    ["Beer", "啤酒"],
    ["Wine (any)", "果酒（任何类型）"],
    ["Wine", "果酒"],
    ["Juice (any)", "果汁（任何类型）"],
    ["Juice", "果汁"],
    ["Clam", "蛤"],
    ["Poppy", "虞美人花"],
    ["Copper Ore", "铜矿石"],
    ["Iron Ore", "铁矿石"],
    ["Coal", "煤炭"],
    ["Gold Ore", "黄金矿石"],
    ["Iridium Ore", "铱矿石"],
    ["Wood", "木材"],
    ["Stone", "石头"],
    ["Nautilus Shell", "鹦鹉螺"],
    ["Coral", "珊瑚"],
    ["Rainbow Shell", "彩虹贝壳"],
    ["Spice Berry", "香味浆果"],
    ["Sea Urchin", "海胆"],
    ["Grape", "葡萄"],
    ["Spring Onion", "大葱"],
    ["Strawberry", "草莓"],
    ["Sweet Pea", "甜豌豆"],
    ["Common Mushroom", "普通蘑菇"],
    ["Wild Plum", "野梅"],
    ["Hazelnut", "榛子"],
    ["Blackberry", "黑莓"],
    ["Winter Root", "冬根"],
    ["Crystal Fruit", "水晶果"],
    ["Snow Yam", "雪山药"],
    ["Sweet Gem Berry", "宝石甜莓"],
    ["Crocus", "番红花"],
    ["Red Mushroom", "红蘑菇"],
    ["Sunflower", "向日葵"],
    ["Purple Mushroom", "紫蘑菇"],
    ["Cheese", "奶酪"],
    ["Goat Cheese", "山羊奶酪"],
    ["Cloth", "布料"],
    ["Truffle", "松露"],
    ["Truffle Oil", "松露油"],
    ["Coffee Bean", "咖啡豆"],
    ["Goat Milk", "羊奶"],
    ["Large Goat Milk", "大瓶羊奶"],
    ["Wool", "动物毛"],
    ["Duck Egg", "鸭蛋"],
    ["Duck Feather", "鸭毛"],
    ["Caviar", "鱼籽酱"],
    ["Rabbit's Foot", "兔子的脚"],
    ["Aged Roe", "腌鱼籽"],
    ["Ancient Fruit", "上古水果"],
    ["Mead", "蜜蜂酒"],
    ["Tulip", "郁金香"],
    ["Summer Spangle", "夏季亮片"],
    ["Fairy Rose", "玫瑰仙子"],
    ["Blue Jazz", "蓝爵"],
    ["Apple", "苹果"],
    ["Green Tea", "绿茶"],
    ["Apricot", "杏子"],
    ["Orange", "橙子"],
    ["Peach", "桃子"],
    ["Pomegranate", "石榴"],
    ["Cherry", "樱桃"],
    ["Bug Meat", "虫肉"],
    ["Hardwood", "硬木"],
    ["Maple Syrup", "枫糖浆"],
    ["Oak Resin", "橡树树脂"],
    ["Pine Tar", "松焦油"],
    ["Slime", "史莱姆泥"],
    ["Bat Wing", "蝙蝠翅膀"],
    ["Solar Essence", "太阳精华"],
    ["Void Essence", "虚空精华"],
    ["Fiber", "纤维"],
    ["Battery Pack", "电池组"],
    ["Dinosaur Mayonnaise", "恐龙蛋黄酱"],
    ["Roe (any)", "鱼籽（任何类型）"],
    ["Roe", "鱼籽"],
    ["Squid Ink", "鱿鱼墨汁"],
    ["Tea Leaves", "茶叶"],
    ["Ginger", "姜"],
    ["Taro Root", "芋头"],
    ["Pineapple", "菠萝"],
    ["Mango", "芒果"],
    ["Cinder Shard", "火山晶石"],
    ["Magma Cap", "熔岩菇"],
    ["Bone Fragment", "骨头碎片"],
    ["Radioactive Ore", "放射性矿石"],
    ["Radioactive Bar", "放射性矿锭"]
]);
// 烹饪
const translateCookingMap = new Map([
    ["Algae Soup", "海藻汤"],
    ["Artichoke Dip", "水煮洋蓟"],
    ["Autumn's Bounty", "秋日恩赐"],
    ["Baked Fish", "烤鱼"],
    ["Banana Pudding", "香蕉布丁"],
    ["Bean Hotpot", "豆类火锅"],
    ["Blackberry Cobbler", "黑莓脆皮饼"],
    ["Blueberry Tart", "蓝莓千层酥"],
    ["Bread", "面包"],
    ["Bruschetta", "意式烤面包"],
    ["Carp Surprise", "惊喜鲤鱼"],
    ["Cheese Cauliflower", "乳酪花椰菜"],
    ["Chocolate Cake", "巧克力蛋糕"],
    ["Chowder", "海鲜杂烩汤"],
    ["Coleslaw", "卷心菜沙拉"],
    ["Complete Breakfast", "完美早餐"],
    ["Cookie", "饼干"],
    ["Crab Cakes", "蟹黄糕"],
    ["Cranberry Candy", "蔓越莓糖果"],
    ["Cranberry Sauce", "红莓酱"],
    ["Crispy Bass", "香酥鲈鱼"],
    ["Dish O' The Sea", "海之菜肴"],
    ["Eggplant Parmesan", "帕尔玛奶酪茄子"],
    ["Escargot", "法式田螺"],
    ["Farmer's Lunch", "农夫午餐"],
    ["Fiddlehead Risotto", "意式蕨菜炖饭"],
    ["Fish Stew", "烩鱼汤"],
    ["Fish Taco", "鱼肉卷"],
    ["Fried Calamari", "炸鱿鱼"],
    ["Fried Eel", "炒鳗鱼"],
    ["Fried Egg", "荷包蛋"],
    ["Fried Mushroom", "炒蘑菇"],
    ["Fruit Salad", "水果沙拉"],
    ["Glazed Yams", "琉璃山药"],
    ["Ginger Ale", "姜汁汽水"],
    ["Hashbrowns", "薯饼"],
    ["Ice Cream", "冰淇淋"],
    ["Lobster Bisque", "龙虾浓汤"],
    ["Lucky Lunch", "幸运午餐"],
    ["Maki Roll", "生鱼寿司"],
    ["Mango Sticky Rice", "芒果糯米饭"],
    ["Maple Bar", "枫糖棒"],
    ["Miner's Treat", "矿工特供"],
    ["Omelet", "煎蛋卷"],
    ["Pale Broth", "清汤"],
    ["Pancakes", "薄煎饼"],
    ["Parsnip Soup", "防风草汤"],
    ["Pepper Poppers", "爆炒青椒"],
    ["Pink Cake", "粉红蛋糕"],
    ["Pizza", "披萨"],
    ["Plum Pudding", "葡萄干布丁"],
    ["Poi", "夏威夷芋泥"],
    ["Poppyseed Muffin", "虞美人籽松糕"],
    ["Pumpkin Pie", "南瓜派"],
    ["Pumpkin Soup", "南瓜汤"],
    ["Radish Salad", "萝卜沙拉"],
    ["Red Plate", "红之盛宴"],
    ["Rhubarb Pie", "大黄派"],
    ["Rice Pudding", "大米布丁"],
    ["Roasted Hazelnuts", "烤榛子"],
    ["Roots Platter", "块茎拼盘"],
    ["Salad", "沙拉"],
    ["Salmon Dinner", "鲑鱼晚餐"],
    ["Sashimi", "生鱼片"],
    ["Seafoam Pudding", "海泡布丁"],
    ["Shrimp Cocktail", "虾鸡尾酒"],
    ["Spaghetti", "意大利面"],
    ["Spicy Eel", "香辣鳗鱼"],
    ["Squid Ink Ravioli", "墨汁意大利饺"],
    ["Stir Fry", "蔬菜什锦盖饭"],
    ["Strange Bun", "奇怪的小面包"],
    ["Stuffing", "塞料面包"],
    ["Super Meal", "巨无霸餐"],
    ["Survival Burger", "救生汉堡"],
    ["Tom Kha Soup", "椰汁汤"],
    ["Tortilla", "墨西哥薄饼"],
    ["Triple Shot Espresso", "三倍浓缩咖啡"],
    ["Tropical Curry", "热带咖喱"],
    ["Trout Soup", "鳟鱼汤"],
    ["Vegetable Medley", "蔬菜杂烩 "],
    ["Bug Steak", "虫肉块"],
    ["Field Snack", "工作小食"],
    ["Life Elixir", "生命药水"],
    ["Oil of Garlic", "蒜油"],
]);
// 汇总
const translateMap = new Map([
    ...translateTitleMap,
    ...translateFarmTypeMap,
    ...translateSeasonMap,
    ...translateSkillMap,
    ...translateMonsterMap,
    ...translateVillagerMap,
    ...translateFishMap,
    ...translateShippableItemMap,
    ...translateCookingMap
])

// console.log(
//     "字典导入完毕，各个类别：\n",
//     "标题 " + translateTitleMap.size + " 种\n",
//     "农场类型 " + translateFarmTypeMap.size + " 种\n",
//     "季节 " + translateSeasonMap.size + " 种\n",
//     "技能 " + translateSkillMap.size + " 种\n",
//     "怪物 " + translateMonsterMap.size + " 种\n",
//     "村民 " + translateVillagerMap.size + " 种\n",
//     "鱼 " + translateFishMap.size + " 种\n",
//     "总计 " + translateMap.size + " 种\n"
// );

// 标题-中译英
const reversedTranslateTitleMap = new Map([
    ["关于", "About"],
    ["选择存档", "Choose Save File"],
    ["结果", "Results"],
    ["概括", "Summary"],
    ["金钱", "Money"],
    ["技能", "Skills"],
    ["任务", "Quests"],
    ["怪物狩猎", "Monster Hunting"],
    ["星之果实", "Stardrops"],
    ["住所与家庭", "Home and Family"],
    ["社交", "Social"],
    ["烹饪", "Cooking"],
    ["制作", "Crafting"],
    ["钓鱼", "Fishing"],
    ["售卖", "Basic Shipping"],
    ["农作物售卖", "Crop Shipping"],
    ["博物馆收集", "Museum Collection"],
    ["秘密纸条", "Secret Notes"],
    ["社区中心收集 / Joja社区开发", "Community Center / Joja Community Development"],
    ["爷爷的评估", "Grandpa's Evaluation"],
    ["特殊订单", "Special Orders"],
    ["日记残页", "Journal Scraps"],
    ["金色核桃", "Golden Walnuts"],
    ["姜岛升级", "Island Upgrades"],
    ["完美度追踪器", "Perfection Tracker"]
]);

// 转换函数
function translateWord(word, type = "all") {
    var newWord = word;
    switch (type) {
        case "title":
            newWord = translateTitleMap.has(word) ? translateTitleMap.get(word) : word;
            break;
        case "reversed title":
            newWord = reversedTranslateTitleMap.has(word) ? reversedTranslateTitleMap.get(word) : word;
            break;
        case "farm type":
            newWord = translateFarmTypeMap.has(word) ? translateFarmTypeMap.get(word) : word;
            break;
        case "season":
            newWord = translateSeasonMap.has(word) ? translateSeasonMap.get(word) : word;
            break;
        case "skill":
            newWord = translateSkillMap.has(word) ? translateSkillMap.get(word) : word;
            break;
        case "monster":
            newWord = translateMonsterMap.has(word) ? translateMonsterMap.get(word) : word;
            break;
        case "villager":
            newWord = translateVillagerMap.has(word) ? translateVillagerMap.get(word) : word;
            break;
        case "fish":
            newWord = translateFishMap.has(word) ? translateFishMap.get(word) : word;
            break;
        case "shipping":
            newWord = translateShippableItemMap.has(word) ? translateShippableItemMap.get(word) : word;
            break;
        case "cooking":
            newWord = translateCookingMap.has(word) ? translateCookingMap.get(word) : word;
            break;
        case "all":
            newWord = translateMap.has(word) ? translateMap.get(word) : word;
            break;
        default:
            newWord = translateMap.has(word) ? translateMap.get(word) : word;
    }
    return newWord;
}
