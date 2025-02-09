/* stardew-checkup.js
 * https://mouseypounds.github.io/stardew-checkup/
 */

/*jslint indent: 4, maxerr: 50, passfail: false, browser: true, regexp: true, plusplus: true */
/*global $, FileReader */

window.onload = function () {
	"use strict";

	// Check for required File API support.
	if (!(window.File && window.FileReader)) {
		document.getElementById('out').innerHTML = '<span class="error">Fatal Error: Could not load the File & FileReader APIs</span>';
		return;
	}

	// Show input field immediately
	$(document.getElementById('input-container')).show();

	// Utility functions
	function addCommas(x) {
		// Jamie Taylor @ https://stackoverflow.com/questions/3883342/add-commas-to-a-number-in-jquery
		return x.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
	}

	function capitalize(s) {
		// joelvh @ https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
		return s && s[0].toUpperCase() + s.slice(1);
	}

	function compareSemVer(a, b) {
		// semver-compare by James Halliday ("substack") @ https://github.com/substack/semver-compare
		var pa = a.split('.');
		var pb = b.split('.');
		for (var i = 0; i < 3; i++) {
			var na = Number(pa[i]);
			var nb = Number(pb[i]);
			if (na > nb) return 1;
			if (nb > na) return -1;
			if (!isNaN(na) && isNaN(nb)) return 1;
			if (isNaN(na) && !isNaN(nb)) return -1;
		}
		return 0;
	}

	function getAchieveString(name, desc, yes) {
		if (desc.length > 0) {
			desc = '(' + desc + ') ';
		}
		return (yes) ? '<span class="ach_yes"><span class="ach">成就：' + name + '</span> ' + desc + ' 已完成</span>' :
					'<span class="ach_no"><span class="ach">成就：' + name + '</span> ' + desc + '</span> -- 还需要 ';
	}

	function getAchieveImpossibleString(name, desc) {
		if (desc.length > 0) {
			desc = '(' + desc + ') ';
		}
		return '<span class="ach_imp"><span class="ach">' + name + '</span> ' + desc + ' 无法完成</span>';
	}

	function getMilestoneString(desc, yes) {
		return (yes) ? '<span class="ms_yes">' + desc + '</span>' :
					'<span class="ms_no">' + desc + '</span> -- 还需要 ';
	}

	function getPointString(pts, desc, cum, yes) {
		var c = (cum) ? '额外 ' : '';
		return (yes) ? '<span class="pt_yes"><span class="pts">+' + c + pts + ' 分</span> 已经获得 (' + desc + ')</span>' :
					'<span class="pt_no"><span class="pts"> (' + c + pts + ' 分)</span> 可以获得 (' + desc + ')</span>';
	}

	function getPointImpossibleString(pts, desc) {
		return '<span class="pt_imp"><span class="pts">+' + pts + ' 分</span> 无法获得 (' + desc + ')</span>';
	}

	function getPerfectionPctString(pct, max, desc, yes) {
		var pts = max * pct;
		var places = 2;
		if (pct < .0001 || pct > .9999) { places = 0 };
		pts = pts.toFixed(places);
		var pretty_pct = 100*pct;
		pretty_pct = pretty_pct.toFixed(Math.max(0, places-1));
		return (yes) ? '<span class="pt_yes"><span class="pts">' + pts + '%</span> 从 ' + desc + ' 完成获得</span>' :
					'<span class="pt_no"><span class="pts"> ' + pts + '%</span> (占比 ' + max + '%) 从 ' + desc +
					' (' + pretty_pct + '%) 中获得</span>';
	}
	
	function getPerfectionNumString(num, max, desc, yes) {
		var pts = num;
		var pretty_pct = num + "/" + max;
		return (yes) ? '<span class="pt_yes"><span class="pts">' + pts + '%</span> 从完成 ' + desc + ' 获得</span>' :
					'<span class="pt_no"><span class="pts"> ' + pts + '%</span> (占比 ' + max + '%) 从 ' + desc +
					' (' + pretty_pct + ') 中获得</span>';
	}
	
	function getPerfectionPctNumString(pct, max, count, desc, yes) {
		var pts = max * pct;
		var places = 2;
		if (pct < .0001 || pct > .9999) { places = 0 };
		pts = pts.toFixed(places);
		var pretty_pct = Math.round(count * pct) + "/" + count + " or " + Number(100*pct).toFixed(Math.max(0, places-1)) + "%";
		return (yes) ? '<span class="pt_yes"><span class="pts">' + pts + '%</span> 从完成 ' + desc + ' 获得</span>' :
					'<span class="pt_no"><span class="pts"> ' + pts + '%</span> (占比 ' + max + '%) 从 ' + desc +
					' (' + pretty_pct + ') 中获得</span>';
	}

	function getPerfectionBoolString(max, desc, yes) {
		return (yes) ? ('<span class="pt_yes"><span class="pts">' + max + '%</span> 从完成 ' + desc + ' 获得</span>') :
					('<span class="pt_no"><span class="pts"> 0%</span> (占比 ' + max + '%) 从 ' + desc + '</span>');
	}

	function wikify(item, page, no_anchor, type = "all") {
		// removing egg colors & changing spaces to underscores
		var trimmed = item.replace(' (White)', '');
		trimmed = trimmed.replace(' (Brown)', '');
		trimmed = trimmed.replace(/#/g, '.23');
		// trimmed = trimmed.replace(/ /g, '_');
        trimmed = trimmed.replace(/_/g, ' ');
        
        var itemChinese = "", trimmedChinese = "";
        if (item.startsWith('Secret Note ')) {
            // 秘密纸条类需要特殊处理
            itemChinese = "秘密纸条 #" + item.slice(13);
            trimmedChinese = "秘密纸条#秘密纸条_#" + item.slice(13);
        } 
        else if (item.startsWith('Journal Scrap ')) {
            itemChinese = "日记残页 #" + item.slice(15);
            trimmedChinese = "日记残页#日记残页_#" + item.slice(15);
        }
        else {
            itemChinese = translateWord(item, type);
            trimmedChinese = translateWord(trimmed, type);
            
            if (type === "bundle") {
                // 收集包处理
                trimmedChinese = '收集包#' + trimmedChinese;
            }
            else if (type === "special order") {
                // 特别任务处理
                trimmedChinese = '任务#鹈鹕镇的特别任务列表';
            }
            if (trimmedChinese.indexOf('史莱姆') !== -1 && type === 'monster') {
                // 中文 wiki 将史莱姆重定义到史莱姆泥，怪物需要特殊处理
                trimmedChinese = '史莱姆（怪物）';
            }
            else if (trimmedChinese.indexOf('蝙蝠') !== -1 && type === 'monster') {
                // 蝙蝠只有一个分类
                trimmedChinese = '蝙蝠';
            }
        }

        // if (saveInfo.wikiPref === "official_chinese") {
        //     return ('<a href="https://zh.stardewvalleywiki.com/' + translateWord(trimmed, type) + '">' + translateWord(item, type) + '</a>');
        // }
        // else if (saveInfo.wikiPref === "huiji") {
        //     return ('<a href="https://xinglugu.huijiwiki.com/wiki/' + translateWord(trimmed, type) + '">' + translateWord(item, type) + '</a>');
        // }
        // else {
        //     if (page) {
        //         return (no_anchor) ? ('<a href="http://stardewvalleywiki.com/' + page + '">' + item + '</a>') :
        //             ('<a href="http://stardewvalleywiki.com/' + page + '#' + trimmed + '">' + item + '</a>');
        //     } else {
        //         return ('<a href="http://stardewvalleywiki.com/' + trimmed + '">' + translateWord(item, type) + '</a>');
        //     }
        // }
        return ('<a href="https://zh.stardewvalleywiki.com/' + trimmedChinese + '">' + itemChinese + '</a>');
	}

	function wikimap(item, index, arr) {
		// Wrapper to allow wikify to be used within an array map without misinterpreting the 2nd and 3rd arguments.
		return wikify(item);
	}
	
	function printTranspose(table) {
		var output = '<table class="output">',
			id;
		for (var r = 0; r < table[0].length; r++) {
			output += '<tr>';
			for (var c = 0; c < table.length; c++) {
				id = 'PL_' + (c+1);
				output += '<td class="' + id + '">' + table[c][r] + '</td>';
			}
			output += '</tr>';
		}
		output += '</table>';
		return output;
	}
	
	function isValidFarmhand(player) {
		// Had been using a blank userID field to determine that a farmhand slot is empty
		// until a user sent a save where a valid farmhand had no ID. Now using both a blank
		// userID and name field and hoping that it's enough.
		if (($(player).children('userID').text() === '') && ($(player).children('name').text() === '')) {
			return false;
		}
		return true;
	}
	
	function getSummaryClass(saveInfo, version) {
		// Relatively simple conditional checks that need to be done a whole lot
		var prefs = (compareSemVer(version, "1.5") < 0) ? saveInfo.outputPrefOld : saveInfo.outputPrefNew;
		var sum_class = "initial_hide";
		if (prefs === 'show_all' || prefs === 'hide_details') {
			sum_class = "initial_show";
		}
		return sum_class;
	}
	
	function getDetailsClass(saveInfo, version) {
		// Relatively simple conditional checks that need to be done a whole lot
		var prefs = (compareSemVer(version, "1.5") < 0) ? saveInfo.outputPrefOld : saveInfo.outputPrefNew;
		var det_class = "initial_show";
		if (prefs === 'hide_all' || prefs === 'hide_details') {
			det_class = "initial_hide";
		}			
		return det_class;
	}

	function getPTLink(input, isPct) {
		// Makes link to Perfection Tracker from given info
		// If 'isPct' is true, will convert to a percentage rounded to 1 decimal
		if (isPct) {
			var places = (input === 1) ? 0 : 1;
			var n = Number(100*input).toFixed(places);
			input = n + '%';
		}
		
		return ' (<a href="#sec_Perfection_Tracker">进度: ' + input + '</a>)';
	}
	
	function getSectionHeader(saveInfo, title, anchor, showDetailsButton, version) {
		// Sets up title and buttons which control the collapsible output
		// showDetailsButton is a bool so that we don't have a control for empty details
		// version is when that section was added and is used for old vs new interpretation
		//   version 1.2 is the baseline value for most original sections
		//   "old" currently means before version 1.5 and "new" is 1.5 & later
		var prefs = (compareSemVer(version, "1.5") < 0) ? saveInfo.outputPrefOld : saveInfo.outputPrefNew;
		
		var output = '<div class="collapsible" id="wrap_' + anchor + '"><h3 id="123">' + translateWord(title, "title") + '</h3>';
		var sum_button, sum_class, det_button, det_class;

		if (prefs === 'show_all' || prefs === 'hide_details') {
			sum_button = "Hide Summary";
		} else {
			sum_button = "Show Summary";
		}			
		if (prefs === 'hide_all' || prefs === 'hide_details') {
			det_button = "Show Details";
		} else {
			det_button = "Hide Details";
		}			

		// Supporting sections that don't have details also should not have the button. We'll leave the empty div alone
		var button_element = "(没有详情)";
		if (showDetailsButton) {
			button_element = '<button id="toggle_' + anchor + '_details" type="button" data-target="' + anchor + '_details">' + det_button + '</button>';
		}
		
		output += ' <button id="toggle_' + anchor + '_summary" type="button" data-target="' + anchor + '_summary">' + sum_button + '</button> ' + button_element;
		return output;
	}
	
	function getSectionFooter() {
		// Companion to getSectionHeader() that mainly exists so that we close all the things the header opened
		// Currently almost pointless but better base for future expansion.
		return '</div>';
	}

	function collapsibleWrap(saveInfo, title, output, version) { return "<h4>PLACEHOLDER</h4>" + output; }
	
	function makeAnchor(text) {
		// forces lower-case and converts non-alpha characters to underscore for simple ID attributes
		var id = text;
		id.toLowerCase();
		return id.replace(/[^\w*]/g, '_');
	}
	
	// Individual chunks of save parsing.
	// Each receives the xmlDoc object to parse & the saveInfo information structure and returns HTML to output.
	// Most also create a meta object which is passed to the per-player info subroutine primarily to find out if 
	// there are any details so that we know whether to show a button later.
	function parseSummary(xmlDoc, saveInfo) {
		var title = "Summary",
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			output = '',
			details = '',
			farmTypes = ['Standard', 'Riverland', 'Forest', 'Hill-top', 'Wilderness', 'Four Corners', 'Beach'],
			playTime = Number($(xmlDoc).find('player > millisecondsPlayed').text()),
			playHr = Math.floor(playTime / 36e5),
			playMin = Math.floor((playTime % 36e5) / 6e4),
			id = "0",
			name = $(xmlDoc).find('player > name').html(),
			farmer = name,
			farmhands = [];
		
		// Versioning has changed from bools to numers, to now a semver string.
		saveInfo.version = $(xmlDoc).find('gameVersion').first().text();
		if (saveInfo.version === "") {
			saveInfo.version = "1.2";
			if ($(xmlDoc).find('hasApplied1_4_UpdateChanges').text() === 'true') {
				saveInfo.version = "1.4";
			} else if ($(xmlDoc).find('hasApplied1_3_UpdateChanges').text() === 'true') {
				saveInfo.version = "1.3";
			}
		}

		// Namespace prefix varies by platform; iOS saves seem to use 'p3' and PC saves use 'xsi'.
		saveInfo.ns_prefix = ($(xmlDoc).find('SaveGame[xmlns\\:xsi]').length > 0) ? 'xsi': 'p3';
		// Farmer, farm, and child names are read as html() because they come from user input and might contain characters
		// which must be escaped.
		saveInfo.players = {};
		saveInfo.children = {};
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			id = $(xmlDoc).find('player > UniqueMultiplayerID').text();
		}
		saveInfo.players[id] = name;
		saveInfo.children[id] = [];
		$(xmlDoc).find("[" + saveInfo.ns_prefix + "\\:type='FarmHouse'] NPC[" + saveInfo.ns_prefix + "\\:type='Child']").each(function () {
			saveInfo.children[id].push($(this).find('name').html());
		});
		saveInfo.numPlayers = 1;
		// Initializing structures needed for perfectionTracker since a lot of it builds on other milestones
		saveInfo.perfectionTracker = { 'global': {
			'Gold Clock': false,
			'Earth Obelisk': false,
			'Water Obelisk': false,
			'Desert Obelisk': false,
			'Island Obelisk': false,
			'Walnuts': { 'count': 0, 'total': 130 },
			} };
		saveInfo.perfectionTracker[id] = {};
		
		output = getSectionHeader(saveInfo, title, anchor, false, version);
		output += '<div class="' + anchor + '_summary ' + sum_class + '">';
		output += '<span class="result">' + $(xmlDoc).find('player > farmName').html() + ' 农场 (' + 
			translateWord(farmTypes[$(xmlDoc).find('whichFarm').text()], "farm type") + ')</span><br />';
		output += '<span class="result">农夫 ' + name ;
		$(xmlDoc).find('farmhand').each(function() {
			if (isValidFarmhand(this)) {
				saveInfo.numPlayers++;
				id = $(this).children('UniqueMultiplayerID').text();
				name = $(this).children('name').html();
				farmhands.push(name);
				saveInfo.players[id] = name;
				saveInfo.children[id] = [];
				$(this).parent('indoors[' + saveInfo.ns_prefix + '\\:type="Cabin"]').find("NPC[" + saveInfo.ns_prefix + "\\:type='Child']").each(function () {
					saveInfo.children[id].push($(this).find('name').html());
				});
				saveInfo.perfectionTracker[id] = {};
			}
		});
		if (saveInfo.numPlayers > 1) {
			output += ' 与雇农 ' + farmhands.join(', ');
			createPlayerList(saveInfo.numPlayers, farmer, farmhands);
		}
		output += '</span><br />';
		// Searching for marriage between players & their children
		saveInfo.partners = {};
		$(xmlDoc).find('farmerFriendships > item').each(function() {
			var item = this;
			if ($(this).find('value > Friendship > Status').text() === 'Married') {
				var id1 = $(item).find('key > FarmerPair > Farmer1').text();
				var id2 = $(item).find('key > FarmerPair > Farmer2').text();
				saveInfo.partners[id1] = id2;
				saveInfo.partners[id2] = id1;
			}
		});
		// Dump of most items in ObjectInformation, needed for Bundle processing.
		saveInfo.objects = {
			16: "Wild Horseradish",
			18: "Daffodil",
			20: "Leek",
			22: "Dandelion",
			24: "Parsnip",
			60: "Emerald",
			62: "Aquamarine",
			64: "Ruby",
			66: "Amethyst",
			68: "Topaz",
			69: "Banana Sapling",
			70: "Jade",
			72: "Diamond",
			74: "Prismatic Shard",
			78: "Cave Carrot",
			80: "Quartz",
			82: "Fire Quartz",
			84: "Frozen Tear",
			86: "Earth Crystal",
			88: "Coconut",
			90: "Cactus Fruit",
			91: "Banana",
			92: "Sap",
			93: "Torch",
			96: "Dwarf Scroll I",
			97: "Dwarf Scroll II",
			98: "Dwarf Scroll III",
			99: "Dwarf Scroll IV",
			100: "Chipped Amphora",
			101: "Arrowhead",
			103: "Ancient Doll",
			104: "Elvish Jewelry",
			105: "Chewing Stick",
			106: "Ornamental Fan",
			107: "Dinosaur Egg",
			108: "Rare Disc",
			109: "Ancient Sword",
			110: "Rusty Spoon",
			111: "Rusty Spur",
			112: "Rusty Cog",
			113: "Chicken Statue",
			114: "Ancient Seed",
			115: "Prehistoric Tool",
			116: "Dried Starfish",
			117: "Anchor",
			118: "Glass Shards",
			119: "Bone Flute",
			120: "Prehistoric Handaxe",
			121: "Dwarvish Helm",
			122: "Dwarf Gadget",
			123: "Ancient Drum",
			124: "Golden Mask",
			125: "Golden Relic",
			126: "Strange Doll (Green)",
			127: "Strange Doll (Yellow)",
			128: "Pufferfish",
			129: "Anchovy",
			130: "Tuna",
			131: "Sardine",
			132: "Bream",
			136: "Largemouth Bass",
			137: "Smallmouth Bass",
			138: "Rainbow Trout",
			139: "Salmon",
			140: "Walleye",
			141: "Perch",
			142: "Carp",
			143: "Catfish",
			144: "Pike",
			145: "Sunfish",
			146: "Red Mullet",
			147: "Herring",
			148: "Eel",
			149: "Octopus",
			150: "Red Snapper",
			151: "Squid",
			152: "Seaweed",
			153: "Green Algae",
			154: "Sea Cucumber",
			155: "Super Cucumber",
			156: "Ghostfish",
			157: "White Algae",
			158: "Stonefish",
			159: "Crimsonfish",
			160: "Angler",
			161: "Ice Pip",
			162: "Lava Eel",
			163: "Legend",
			164: "Sandfish",
			165: "Scorpion Carp",
			166: "Treasure Chest",
			167: "Joja Cola",
			168: "Trash",
			169: "Driftwood",
			170: "Broken Glasses",
			171: "Broken CD",
			172: "Soggy Newspaper",
			174: "Large Egg (White)",
			176: "Egg (White)",
			178: "Hay",
			180: "Egg (Brown)",
			182: "Large Egg (Brown)",
			184: "Milk",
			186: "Large Milk",
			188: "Green Bean",
			190: "Cauliflower",
			192: "Potato",
			194: "Fried Egg",
			195: "Omelet",
			196: "Salad",
			197: "Cheese Cauliflower",
			198: "Baked Fish",
			199: "Parsnip Soup",
			200: "Vegetable Medley",
			201: "Complete Breakfast",
			202: "Fried Calamari",
			203: "Strange Bun",
			204: "Lucky Lunch",
			205: "Fried Mushroom",
			206: "Pizza",
			207: "Bean Hotpot",
			208: "Glazed Yams",
			209: "Carp Surprise",
			210: "Hashbrowns",
			211: "Pancakes",
			212: "Salmon Dinner",
			213: "Fish Taco",
			214: "Crispy Bass",
			215: "Pepper Poppers",
			216: "Bread",
			218: "Tom Kha Soup",
			219: "Trout Soup",
			220: "Chocolate Cake",
			221: "Pink Cake",
			222: "Rhubarb Pie",
			223: "Cookie",
			224: "Spaghetti",
			225: "Fried Eel",
			226: "Spicy Eel",
			227: "Sashimi",
			228: "Maki Roll",
			229: "Tortilla",
			230: "Red Plate",
			231: "Eggplant Parmesan",
			232: "Rice Pudding",
			233: "Ice Cream",
			234: "Blueberry Tart",
			235: "Autumn's Bounty",
			236: "Pumpkin Soup",
			237: "Super Meal",
			238: "Cranberry Sauce",
			239: "Stuffing",
			240: "Farmer's Lunch",
			241: "Survival Burger",
			242: "Dish O' The Sea",
			243: "Miner's Treat",
			244: "Roots Platter",
			245: "Sugar",
			246: "Wheat Flour",
			247: "Oil",
			248: "Garlic",
			250: "Kale",
			251: "Tea Sapling",
			252: "Rhubarb",
			253: "Triple Shot Espresso",
			254: "Melon",
			256: "Tomato",
			257: "Morel",
			258: "Blueberry",
			259: "Fiddlehead Fern",
			260: "Hot Pepper",
			261: "Warp Totem: Desert",
			262: "Wheat",
			264: "Radish",
			265: "Seafoam Pudding",
			266: "Red Cabbage",
			267: "Flounder",
			268: "Starfruit",
			269: "Midnight Carp",
			270: "Corn",
			271: "Unmilled Rice",
			272: "Eggplant",
			273: "Rice Shoot",
			274: "Artichoke",
			275: "Artifact Trove",
			276: "Pumpkin",
			278: "Bok Choy",
			279: "Magic Rock Candy",
			280: "Yam",
			281: "Chanterelle",
			282: "Cranberries",
			283: "Holly",
			284: "Beet",
			286: "Cherry Bomb",
			287: "Bomb",
			288: "Mega Bomb",
			289: "Ostrich Egg",
			292: "Mahogany Seed",
			293: "Brick Floor",
			296: "Salmonberry",
			297: "Grass Starter",
			298: "Hardwood Fence",
			299: "Amaranth Seeds",
			300: "Amaranth",
			301: "Grape Starter",
			302: "Hops Starter",
			303: "Pale Ale",
			304: "Hops",
			305: "Void Egg",
			306: "Mayonnaise",
			307: "Duck Mayonnaise",
			308: "Void Mayonnaise",
			309: "Acorn",
			310: "Maple Seed",
			311: "Pine Cone",
			322: "Wood Fence",
			323: "Stone Fence",
			324: "Iron Fence",
			325: "Gate",
			328: "Wood Floor",
			329: "Stone Floor",
			330: "Clay",
			331: "Weathered Floor",
			333: "Crystal Floor",
			334: "Copper Bar",
			335: "Iron Bar",
			336: "Gold Bar",
			337: "Iridium Bar",
			338: "Refined Quartz",
			340: "Honey",
			341: "Tea Set",
			342: "Pickles",
			344: "Jelly",
			346: "Beer",
			347: "Rare Seed",
			348: "Wine",
			349: "Energy Tonic",
			350: "Juice",
			351: "Muscle Remedy",
			368: "Basic Fertilizer",
			369: "Quality Fertilizer",
			370: "Basic Retaining Soil",
			371: "Quality Retaining Soil",
			372: "Clam",
			373: "Golden Pumpkin",
			376: "Poppy",
			378: "Copper Ore",
			380: "Iron Ore",
			382: "Coal",
			384: "Gold Ore",
			386: "Iridium Ore",
			388: "Wood",
			390: "Stone",
			392: "Nautilus Shell",
			393: "Coral",
			394: "Rainbow Shell",
			395: "Coffee",
			396: "Spice Berry",
			397: "Sea Urchin",
			398: "Grape",
			399: "Spring Onion",
			400: "Strawberry",
			401: "Straw Floor",
			402: "Sweet Pea",
			403: "Field Snack",
			404: "Common Mushroom",
			405: "Wood Path",
			406: "Wild Plum",
			407: "Gravel Path",
			408: "Hazelnut",
			409: "Crystal Path",
			410: "Blackberry",
			411: "Cobblestone Path",
			412: "Winter Root",
			413: "Blue Slime Egg",
			414: "Crystal Fruit",
			415: "Stepping Stone Path",
			416: "Snow Yam",
			417: "Sweet Gem Berry",
			418: "Crocus",
			419: "Vinegar",
			420: "Red Mushroom",
			421: "Sunflower",
			422: "Purple Mushroom",
			423: "Rice",
			424: "Cheese",
			425: "Fairy Seeds",
			426: "Goat Cheese",
			427: "Tulip Bulb",
			428: "Cloth",
			429: "Jazz Seeds",
			430: "Truffle",
			431: "Sunflower Seeds",
			432: "Truffle Oil",
			433: "Coffee Bean",
			436: "Goat Milk",
			437: "Red Slime Egg",
			438: "L. Goat Milk",
			439: "Purple Slime Egg",
			440: "Wool",
			441: "Explosive Ammo",
			442: "Duck Egg",
			444: "Duck Feather",
			445: "Caviar",
			446: "Rabbit's Foot",
			447: "Aged Roe",
			453: "Poppy Seeds",
			454: "Ancient Fruit",
			455: "Spangle Seeds",
			456: "Algae Soup",
			457: "Pale Broth",
			459: "Mead",
			463: "Drum Block",
			464: "Flute Block",
			465: "Speed-Gro",
			466: "Deluxe Speed-Gro",
			472: "Parsnip Seeds",
			473: "Bean Starter",
			474: "Cauliflower Seeds",
			475: "Potato Seeds",
			476: "Garlic Seeds",
			477: "Kale Seeds",
			478: "Rhubarb Seeds",
			479: "Melon Seeds",
			480: "Tomato Seeds",
			481: "Blueberry Seeds",
			482: "Pepper Seeds",
			483: "Wheat Seeds",
			484: "Radish Seeds",
			485: "Red Cabbage Seeds",
			486: "Starfruit Seeds",
			487: "Corn Seeds",
			488: "Eggplant Seeds",
			489: "Artichoke Seeds",
			490: "Pumpkin Seeds",
			491: "Bok Choy Seeds",
			492: "Yam Seeds",
			493: "Cranberry Seeds",
			494: "Beet Seeds",
			495: "Spring Seeds",
			496: "Summer Seeds",
			497: "Fall Seeds",
			498: "Winter Seeds",
			499: "Ancient Seeds",
			535: "Geode",
			536: "Frozen Geode",
			537: "Magma Geode",
			538: "Alamite",
			539: "Bixite",
			540: "Baryte",
			541: "Aerinite",
			542: "Calcite",
			543: "Dolomite",
			544: "Esperite",
			545: "Fluorapatite",
			546: "Geminite",
			547: "Helvite",
			548: "Jamborite",
			549: "Jagoite",
			550: "Kyanite",
			551: "Lunarite",
			552: "Malachite",
			553: "Neptunite",
			554: "Lemon Stone",
			555: "Nekoite",
			556: "Orpiment",
			557: "Petrified Slime",
			558: "Thunder Egg",
			559: "Pyrite",
			560: "Ocean Stone",
			561: "Ghost Crystal",
			562: "Tigerseye",
			563: "Jasper",
			564: "Opal",
			565: "Fire Opal",
			566: "Celestine",
			567: "Marble",
			568: "Sandstone",
			569: "Granite",
			570: "Basalt",
			571: "Limestone",
			572: "Soapstone",
			573: "Hematite",
			574: "Mudstone",
			575: "Obsidian",
			576: "Slate",
			577: "Fairy Stone",
			578: "Star Shards",
			579: "Prehistoric Scapula",
			580: "Prehistoric Tibia",
			581: "Prehistoric Skull",
			582: "Skeletal Hand",
			583: "Prehistoric Rib",
			584: "Prehistoric Vertebra",
			585: "Skeletal Tail",
			586: "Nautilus Fossil",
			587: "Amphibian Fossil",
			588: "Palm Fossil",
			589: "Trilobite",
			591: "Tulip",
			593: "Summer Spangle",
			595: "Fairy Rose",
			597: "Blue Jazz",
			599: "Sprinkler",
			604: "Plum Pudding",
			605: "Artichoke Dip",
			606: "Stir Fry",
			607: "Roasted Hazelnuts",
			608: "Pumpkin Pie",
			609: "Radish Salad",
			610: "Fruit Salad",
			611: "Blackberry Cobbler",
			612: "Cranberry Candy",
			613: "Apple",
			614: "Green Tea",
			618: "Bruschetta",
			621: "Quality Sprinkler",
			628: "Cherry Sapling",
			629: "Apricot Sapling",
			630: "Orange Sapling",
			631: "Peach Sapling",
			632: "Pomegranate Sapling",
			633: "Apple Sapling",
			634: "Apricot",
			635: "Orange",
			636: "Peach",
			637: "Pomegranate",
			638: "Cherry",
			645: "Iridium Sprinkler",
			648: "Coleslaw",
			649: "Fiddlehead Risotto",
			651: "Poppyseed Muffin",
			680: "Green Slime Egg",
			681: "Rain Totem",
			682: "Mutant Carp",
			684: "Bug Meat",
			685: "Bait",
			686: "Spinner",
			687: "Dressed Spinner",
			688: "Warp Totem: Farm",
			689: "Warp Totem: Mountains",
			690: "Warp Totem: Beach",
			691: "Barbed Hook",
			692: "Lead Bobber",
			693: "Treasure Hunter",
			694: "Trap Bobber",
			695: "Cork Bobber",
			698: "Sturgeon",
			699: "Tiger Trout",
			700: "Bullhead",
			701: "Tilapia",
			702: "Chub",
			703: "Magnet",
			704: "Dorado",
			705: "Albacore",
			706: "Shad",
			707: "Lingcod",
			708: "Halibut",
			709: "Hardwood",
			710: "Crab Pot",
			715: "Lobster",
			716: "Crayfish",
			717: "Crab",
			718: "Cockle",
			719: "Mussel",
			720: "Shrimp",
			721: "Snail",
			722: "Periwinkle",
			723: "Oyster",
			724: "Maple Syrup",
			725: "Oak Resin",
			726: "Pine Tar",
			727: "Chowder",
			728: "Fish Stew",
			729: "Escargot",
			730: "Lobster Bisque",
			731: "Maple Bar",
			732: "Crab Cakes",
			733: "Shrimp Cocktail",
			734: "Woodskip",
			745: "Strawberry Seeds",
			746: "Jack-O-Lantern",
			747: "Rotten Plant",
			748: "Rotten Plant",
			749: "Omni Geode",
			766: "Slime",
			767: "Bat Wing",
			768: "Solar Essence",
			769: "Void Essence",
			770: "Mixed Seeds",
			771: "Fiber",
			772: "Oil of Garlic",
			773: "Life Elixir",
			774: "Wild Bait",
			775: "Glacierfish",
			787: "Battery Pack",
			795: "Void Salmon",
			796: "Slimejack",
			797: "Pearl",
			798: "Midnight Squid",
			799: "Spook Fish",
			800: "Blobfish",
			802: "Cactus Seeds",
			805: "Tree Fertilizer",
			807: "Dinosaur Mayonnaise",
			812: "Roe",
			814: "Squid Ink",
			815: "Tea Leaves",
			820: "Fossilized Skull",
			821: "Fossilized Spine",
			822: "Fossilized Tail",
			823: "Fossilized Leg",
			824: "Fossilized Ribs",
			825: "Snake Skull",
			826: "Snake Vertebrae",
			827: "Mummified Bat",
			828: "Mummified Frog",
			829: "Ginger",
			830: "Taro Root",
			831: "Taro Tuber",
			832: "Pineapple",
			833: "Pineapple Seeds",
			834: "Mango",
			835: "Mango Sapling",
			836: "Stingray",
			837: "Lionfish",
			838: "Blue Discus",
			840: "Rustic Plank Floor",
			841: "Stone Walkway Floor",
			848: "Cinder Shard",
			851: "Magma Cap",
			852: "Dragon Tooth",
			856: "Curiosity Lure",
			857: "Tiger Slime Egg",
			872: "Fairy Dust",
			873: "Piña Colada",
			874: "Bug Steak",
			877: "Quality Bobber",
			879: "Monster Musk",
			881: "Bone Fragment",
			885: "Fiber Seeds",
			886: "Warp Totem: Island",
			889: "Qi Fruit",
			890: "Qi Bean",
			891: "Mushroom Tree Seed",
			892: "Warp Totem: Qi's Arena",
			893: "Fireworks (Red)",
			894: "Fireworks (Purple)",
			895: "Fireworks (Green)",
			896: "Galaxy Soul",
			898: "Son of Crimsonfish",
			899: "Ms. Angler",
			900: "Legend II",
			901: "Radioactive Carp",
			902: "Glacierfish Jr.",
			903: "Ginger Ale",
			904: "Banana Pudding",
			905: "Mango Sticky Rice",
			906: "Poi",
			907: "Tropical Curry",
			908: "Magic Bait",
			909: "Radioactive Ore",
			910: "Radioactive Bar",
			911: "Horse Flute",
			913: "Enricher",
			915: "Pressure Nozzle",
			917: "Qi Seasoning",
			918: "Hyper Speed-Gro",
			919: "Deluxe Fertilizer",
			920: "Deluxe Retaining Soil",
			921: "Squid Ink Ravioli",
			926: "Cookout Kit",
			928: "Golden Egg",
		}
		// Date originally used XXForSaveGame elements, but those were not always present on saves downloaded from upload.farm
		// output += '<span class="result">Day ' + Number($(xmlDoc).find('dayOfMonth').text()) + ' of ' +
		// 	capitalize($(xmlDoc).find('currentSeason').html()) + ', Year ' + Number($(xmlDoc).find('year').text()) + '</span><br />';
		output += '<span class="result">' + 
                    '第 ' + Number($(xmlDoc).find('year').text()) + ' 年，' +  
			        translateWord(capitalize($(xmlDoc).find('currentSeason').html()), "season") + "第 " + Number($(xmlDoc).find('dayOfMonth').text()) + " 天" + '</span><br />';
        output += '<span class="result">游玩了 ';
		if (playHr === 0 && playMin === 0) {
			output += "不到 1 分钟";
		} else {
			if (playHr > 0) {
				output += playHr + ' 小时 ';
			}
			if (playMin > 0) {
				output += playMin + ' 分钟 ';
			}
		}
		output += '</span><br />';
		var version_num = saveInfo.version;
		output += '<span class="result">存档创建于 ' + version_num + ' 版本</span><br /></div>';
		output += getSectionFooter();
		return output;
	}

	function parseMoney(xmlDoc, saveInfo) {
		var title = 'Money',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
		// This is pretty pointless with shared gold, but I separate everything else for multiplayer...
		table[0] = parsePlayerMoney($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerMoney(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerMoney(player, saveInfo, meta) {
		var output = '',
			money = Number($(player).children('totalMoneyEarned').text());

		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + ' 已经赚了 ' +
			addCommas(money) + 'g.</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (money >= 15e3) ? getAchieveString('新手', '赚取15,000g', 1) :
				getAchieveString('新手', '赚取15,000g', 0) + addCommas(15e3 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 5e4) ? getAchieveString('牛仔', '赚取50,000g', 1) :
				getAchieveString('牛仔', '赚取50,000g', 0) + addCommas(5e4 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 25e4) ? getAchieveString('农场主', '赚取250,000g', 1) :
				getAchieveString('农场主', '赚取250,000g', 0) + addCommas(25e4 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 1e6) ? getAchieveString('百万富翁', '赚取1,000,000g', 1) :
				getAchieveString('百万富翁', '赚取1,000,000g', 0) + addCommas(1e6 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 1e7) ? getAchieveString('千万富翁', '赚取10,000,000g', 1) :
				getAchieveString('千万富翁', '赚取10,000,000g', 0) + addCommas(1e7 - money) + 'g';
		output += '</li></ul></div>';
		return [output];
	}

	function parseSocial(xmlDoc, saveInfo) {
		var title = 'Social',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [],
			spouse = $(xmlDoc).find('player > spouse').text(); // only used for 1.2 engagement checking
			
			meta.countdown = Number($(xmlDoc).find('countdownToWedding').text());
			meta.daysPlayed = Number($(xmlDoc).find('stats > daysPlayed').first().text());
			// NPCs and NPC Types we are ignoring either in location data or friendship data
			meta.ignore = {
				'Horse': 1,
				'Cat': 1,
				'Dog': 1,
				'Fly': 1,
				'Grub': 1,
				'GreenSlime': 1,
				'Gunther': 1,
				'Marlon': 1,
				'Bouncer': 1,
				'Mister Qi': 1,
				'Henchman': 1,
				'Birdie': 1,
			};
			meta.npc = {};
			// <NPC>: [ [<numHearts>, <id>], ... ]
			meta.eventList = {
				'Abigail': [ [2, 1], [4, 2], [6, 4], [8, 3], [10, 901756] ],
				'Alex': [ [2, 20], [4, 2481135], [5, 21], [6, 2119820], [8, 288847], [10, 911526] ],
				'Elliott': [ [2, 39], [4, 40], [6, 423502], [8, 1848481], [10, 43] ],
				'Emily': [ [2, 471942], [4, 463391], [6, 917409], [8, 2123243], [10, 2123343] ],
				'Haley': [ [2, 11], [4, 12], [6, 13], [8, 14], [10, 15] ],
				'Harvey': [ [2, 56], [4, 57], [6, 58], [8, 571102], [10, 528052] ],
				'Leah': [ [2, 50], [4, 51], [6, 52], [8, '53|584059'], [10, 54] ], // 53 art show, 584059 online
				'Maru': [ [2, 6], [4, 7], [6, 8], [8, 9], [10, 10] ],
				'Penny': [ [2, 34], [4, 35], [6, 36], [8, 181928], [10, 38] ],
				'Sam': [ [2, 44], [3, 733330], [4, 46], [6, 45], [8, 4081148], [10, 233104] ],
				'Sebastian': [ [2, 2794460], [4, 384883], [6, 27], [8, 29], [10, 384882] ],
				'Shane': [ [2, 611944], [4, 3910674], [6, 3910975], ['6.8', 3910974], [7, 831125], [8, 3900074], [10, 9581348] ],
				'Caroline': [ [6, 17] ],
				'Clint': [ [3, 97], [6, 101] ],
				'Demetrius': [ [6, 25] ],
				'Dwarf': [ ['0.2', 691039] ],
				'Evelyn': [ [4, 19] ],
				'George': [ [6, 18] ],
				'Gus': [ [4, 96] ],
				'Jas': [  ],
				'Jodi': [ [4, '94|95'] ], // 94 y1, 95 y2
				'Kent': [ [3, 100] ],
				'Krobus': [ ],
				'Lewis': [ [6, 639373] ],
				'Linus': [ ['0.2', 502969], [4, 26] ],
				'Marnie': [ [6, 639373] ],
				'Pam': [ ],
				'Pierre': [ [6, 16] ],
				'Robin': [ [6, 33] ],
				'Sandy': [ ],
				'Vincent': [ ],
				'Willy': [ ],
				'Wizard': [ ],
			};
			if (compareSemVer(saveInfo.version, "1.3") >= 0) {
				meta.eventList.Jas.push([8, 3910979]);
				meta.eventList.Vincent.push([8, 3910979]);
				meta.eventList.Linus.push([8, 371652]);
				meta.eventList.Pam.push([9, 503180]);
				meta.eventList.Willy.push([6, 711130]);
			}
			if (compareSemVer(saveInfo.version, "1.4") >= 0) {
				meta.eventList.Gus.push([5, 980558]);
				// This event does not require 2 hearts, but getting into the room does
				meta.eventList.Caroline.push([2, 719926]);
				// 14-Heart spouse events. Many have multiple parts; to preserve their proper order,
				//  we will use 14.2, 14.3, etc. even though it the requirements are exactly 14
				meta.eventList.Abigail.push([14, 6963327]);
				meta.eventList.Emily.push([14.1, 3917600], [14.2, 3917601]);
				meta.eventList.Haley.push([14.1, 6184643], [14.2, 8675611], [14.3, 6184644]);
				meta.eventList.Leah.push([14.1, 3911124], [14.2, 3091462]);
				meta.eventList.Maru.push([14.1, 3917666], [14.2, 5183338]);
				meta.eventList.Penny.push([14.1, 4325434], [14.2, 4324303]);
				meta.eventList.Alex.push([14.1, 3917587], [14.2, 3917589], [14.3, 3917590]);
				meta.eventList.Elliott.push([14.1, 3912125], [14.2, 3912132]);
				meta.eventList.Harvey.push([14, 3917626]);
				meta.eventList.Sam.push([14.1, 3918600], [14.2, 3918601], [14.3, 3918602], [14.4, 3918603]);
				meta.eventList.Sebastian.push([14.1, 9333219], [14.2, 9333220]);
				meta.eventList.Shane.push([14.1, 3917584], [14.2, 3917585], [14.3, 3917586]);
				meta.eventList.Krobus.push([14, 7771191]);
			}
			if (compareSemVer(saveInfo.version, "1.5") >= 0) {
				meta.eventList['Leo'] = [ [2, 6497423], [4, 6497421], [6, 6497428], [9, 8959199] ];
			}

		// Search locations for NPCs. They could be hardcoded, but this is somewhat more mod-friendly and it also
		// lets us to grab children and search out relationship status for version 1.2 saves.
		$(xmlDoc).find('locations > GameLocation').each(function () {
			$(this).find('characters > NPC').each(function () {
				var type = $(this).attr(saveInfo.ns_prefix + ':type');
				var who = $(this).find('name').html();
				// Filter out animals and monsters
				if (meta.ignore.hasOwnProperty(type) || meta.ignore.hasOwnProperty(who)) {
					return;
				}
				meta.npc[who] = {};
				meta.npc[who].isDatable = ($(this).find('datable').text() === 'true');
				meta.npc[who].isGirl = ($(this).find('gender').text() === '1');
				meta.npc[who].isChild = (type  === 'Child');
				if (compareSemVer(saveInfo.version, "1.3") < 0) {
					if ($(this).find('divorcedFromFarmer').text() === 'true') {
						meta.npc[who].relStatus = 'Divorced';
					} else if (countdown > 0 && who === spouse.slice(0,-7)) {
						meta.npc[who].relStatus = 'Engaged';
					} else if ($(this).find('daysMarried').text() > 0) {
						meta.npc[who].relStatus = 'Married';
					} else if ($(this).find('datingFarmer').text() === 'true') {
						meta.npc[who].relStatus = 'Dating';
					} else {
						meta.npc[who].relStatus = 'Friendly';
					}
				}
			});
		});
		table[0] = parsePlayerSocial($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerSocial(this, saveInfo, meta));
				}
			});
		}
		playerOutput = printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerSocial(player, saveInfo, meta) {
		var output = '',
			table = [],
			count_5h = 0,
			count_10h = 0,
			maxed_count = 0,
			maxed_total = 0,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			points = {},
			list_fam = [],
			list_bach = [],
			list_other = [],
			list_poly = [],
			farmer = $(player).children('name').html(),
			spouse = $(player).children('spouse').html(),
			dumped_Girls = 0,
			dumped_Guys = 0,
			hasSpouseStardrop = false,
			eventsSeen = {},
			hasNPCSpouse = false,
			hasPamHouse = false,
			hasCompletedIntroductions = true,
			list_intro = [],
			polyamory = {
				'All Bachelors': [195013,195099],
				'All Bachelorettes': [195012,195019]
				};
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			$(player).find('activeDialogueEvents > item').each(function () {
				var which = $(this).find('key > string').text();
				var num = Number($(this).find('value > int').text());
				if (which === 'dumped_Girls') {
					dumped_Girls = num;
				} else if (which === 'dumped_Guys') {
					dumped_Guys = num;
				}
			});
			$(player).find('friendshipData > item').each(function () {
				var who = $(this).find('key > string').html();
				if (meta.ignore.hasOwnProperty(who)) { return; }
				if (!meta.npc.hasOwnProperty(who)) {
					// This shouldn't happen
					meta.npc[who] = {'isDatable': false, 'isGirl': false, 'isChild': false};
				}
				var num = Number($(this).find('value > Friendship > Points').text());
				if (num >= 2500) { count_10h++; }
				if (num >= 1250) { count_5h++; }
				// Some redundancy because of keeping the achievement tally separate from Perfection Tracker
				if (meta.eventList.hasOwnProperty(who)) {
					maxed_total++;
					if ( (meta.npc[who].isDatable && num >= 2000) || (num >= 2500) ) { maxed_count++; }
				}
				points[who] = num;
				meta.npc[who].relStatus = $(this).find('value > Friendship > Status').html();
				var isRoommate = ($(this).find('value > Friendship > RoommateMarriage').text() === 'true');
				if (meta.npc[who].relStatus === 'Married' && isRoommate) {
					meta.npc[who].relStatus = 'Roommate'
				}
			});
		} else {
			$(player).find('friendships > item').each(function () {
				var who = $(this).find('key > string').html();
				var num = Number($(this).find('value > ArrayOfInt > int').first().text());
				if (num >= 2500) { count_10h++; }
				if (num >= 1250) { count_5h++; }
				points[who] = num;
			});
			if (meta.countdown > 0) {
				spouse = spouse.slice(0,-7);
			}
		}

		$(player).find('eventsSeen > int').each(function () {
			eventsSeen[$(this).text()] = 1;
		});
		$(player).find('mailReceived > string').each(function () {
			if($(this).text() === 'CF_Spouse') {
				hasSpouseStardrop = true;
			}
			if($(this).text() === 'pamHouseUpgrade') {
				hasPamHouse = true;
			}
		});
		var eventCheck = function (arr, who) {
			var seen = false;
			var neg = 'no';
			// Note we are altering eventInfo from parent function
			String(arr[1]).split('|').forEach( function(e) {
				if (eventsSeen.hasOwnProperty(e)) {
					seen = true;
				}
			});
			// checks for events which can be permanently missed; 1st is Clint 6H, second is Sam 3H
			// Penny 4H & 6H added if Pam House Upgrade is done in some versions.
			if ((arr[1] === 101 && (eventsSeen.hasOwnProperty(2123243) || eventsSeen.hasOwnProperty(2123343))) || 
				(arr[1] === 733330 && meta.daysPlayed > 84) ||
				(arr[1] === 35 && hasPamHouse && (compareSemVer(saveInfo.version, "1.5") < 0)) || 
				(arr[1] === 36 && hasPamHouse && (compareSemVer(saveInfo.version, "1.4") < 0))) {
					neg = 'imp';
				}
			// 10-heart events will be tagged impossible if there is no bouquet.
			if (arr[0] == 10 && meta.npc[who].isDatable && meta.npc[who].relStatus == 'Friendly') {
				neg = 'imp';
			}			
			// 14-heart events will be tagged impossible if the player is married to someone else.
			if (arr[0] >= 14 && who !== spouse) {
				neg = 'imp';
			}
			// Now we are hardcoding 2 events that involve multiple NPCs too.
			var extra = '';
			if (arr[1] === 3910979) {
				extra = " (Jas &amp; Vincent both)";
			} else if (arr[1] === 639373) {
				extra = " (Lewis &amp; Marnie both)";
			}
			eventInfo += ' [<span class="ms_' + (seen ? 'yes':neg) + '">' + arr[0] + '&#x2665;' + extra + '</span>]';
		};
		for (var who in meta.npc) {
			// Overriding status for the confrontation events
			if (dumped_Girls > 0 && npc[who].isDatable && npc[who].isGirl) {
				meta.npc[who].relStatus = 'Angry (' + dumped_Girls + ' more day(s))';
			} else if (dumped_Guys > 0 && npc[who].isDatable && !npc[who].isGirl) {
				nmeta.pc[who].relStatus = 'Angry (' + dumped_Guys + ' more day(s))';
			} 
			var pts = 0;
			if (points.hasOwnProperty(who)) {
				pts = points[who];
			} else {
				meta.npc[who].relStatus = "Unmet";
			}
			var hearts = Math.floor(pts/250);
			var entry = '<li>';
			// entry += (meta.npc[who].isChild) ? who + ' (' + wikify('Child', 'Children') + ')' : wikify(who);
            entry += (meta.npc[who].isChild) ? who + ' (' + '孩子' + ')' : wikify(who, undefined, undefined, "villager");
			entry += ': ' + meta.npc[who].relStatus + ', ' + hearts + '&#x2665; (' + pts + ' pts) -- ';
				
			// Check events
			// We want to only make an Event list item if there are actually events for this NPC.
			var eventInfo = '';
			if (meta.eventList.hasOwnProperty(who)) {
				if (meta.eventList[who].length > 0) {
					eventInfo += '<ul class="compact"><li>事件: ';
					meta.eventList[who].sort(function (a,b) { return a[0] - b[0]; });
					meta.eventList[who].forEach(function (a) { eventCheck(a, who); });
					eventInfo += '</li></ul>';
				}
			}
			var max;
			if (who === spouse) {
				// Spouse Stardrop threshold is 3375 from StardewValley.NPC.checkAction(); 3500 (14 hearts) in 1.4
				max = hasSpouseStardrop ? 3250 : 3375;
				if (compareSemVer(saveInfo.version, "1.4") >= 0) {
					max = 3500;
				}
				entry += (pts >= max) ? '<span class="ms_yes">友好度满 (会衰减)</span></li>' :
					'<span class="ms_no">友好度满需要额外 ' + (max - pts) + ' 友好度</span></li>';
				hasNPCSpouse = true;
				list_fam.push(entry + eventInfo);
			} else if (meta.npc[who].isDatable) {
				max = 2000;
				if (meta.npc[who].relStatus === 'Dating') {
					max = 2500;
				}
				entry += (pts >= max) ? '<span class="ms_yes">友好度满</span></li>' :
					'<span class="ms_no">友好度满需要额外 ' + (max - pts) + ' 友好度</span></li>';
				list_bach.push(entry + eventInfo);
			} else {
				entry += (pts >= 2500) ? '<span class="ms_yes">友好度满</span></li>' :
					'<span class="ms_no">友好度满需要额外 ' + (2500 - pts) + ' 友好度</span></li>';
				if (meta.npc[who].isChild) {
					list_fam.push(entry + eventInfo);
				} else {
					list_other.push(entry + eventInfo);
				}
			}
		}
		if (saveInfo.version >= 1.3) {
			for (var who in polyamory) {
				// Rather than trying to force these to work in the eventCheck function, we make a new checker.
				var seen = false;
				var span = 'no';
				var entry = '<li>' + who;
				for (var id = 0; id < polyamory[who].length; id++ ) {
					if (eventsSeen.hasOwnProperty(polyamory[who][id])) {
						seen = true;
					}
				}
				if (seen) {
					span = 'yes';
				} else if (hasNPCSpouse) {
					span = 'imp';
				}
				entry += ': [<span class="ms_' + span + '">10&#x2665;</span>]</li>';
				list_poly.push(entry);
			}
		}
		$(player).find('questLog > [' + saveInfo.ns_prefix + "\\:type='SocializeQuest'] > whoToGreet > string").each(function () {
			list_intro.push(wikify($(this).text(), undefined, undefined, "villager"));
			hasCompletedIntroductions = false;
		});

		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + (hasCompletedIntroductions ? " 已经" : " 还没有") + 
				'遇见镇子上的所有人</span><ul class="ach_list">\n';
		output += '<li>';
		output += (list_intro.length == 0) ? getMilestoneString('完成<span class="ach">介绍</span>任务', 1) :
				getMilestoneString('完成<span class="ach">介绍</span>任务', 0) + (list_intro.length) + ' 个人';
		output += '</li></ul></div>';
		output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
		if (list_intro.length > 0) {
			output += '<span class="need">未见过面的村民:<ol><li>' + list_intro.sort().join('</li><li>') + '</li></ol></span>\n';
		}
		output += '</div>';
		table.push(output);

		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 与 ' + count_5h + ' 人有5&#x2665;及以上友好度</span><ul class="ach_list">\n';
		output += '<li>';
		output += (count_5h >= 1) ? getAchieveString('新朋友', '与某人达到了5颗心的等级', 1) :
				getAchieveString('新朋友', '与某人达到了5颗心的等级', 0) + (1 - count_5h) + ' 人';
		output += '</li>\n<li>';
		output += (count_5h >= 4) ? getAchieveString('拉帮结派', '与4个人达到了5颗心的等级', 1) :
				getAchieveString('拉帮结派', '与4个人达到了5颗心的等级', 0) + (4 - count_5h) + ' 人\n';
		output += '</li>\n<li>';
		output += (count_5h >= 10) ? getAchieveString('网络交友', '与10个人达到了5颗心的等级', 1) :
				getAchieveString('网络交友', '与10个人达到了5颗心的等级', 0) + (10 - count_5h) + ' 人';
		output += '</li>\n<li>';
		output += (count_5h >= 20) ? getAchieveString('万人迷', '与20个人达到了5颗心的等级', 1) :
				getAchieveString('万人迷', '与20个人达到了5颗心的等级', 0) + (20 - count_5h) + ' 人';
		output += '</li></ul></div>';
		table.push(output);
		
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 与 ' + count_10h + ' 人有10&#x2665;及以上友好度</span><ul class="ach_list">\n';
		output += '<li>';
		output += (count_10h >= 1) ? getAchieveString('最好的朋友', '与某人达到了10颗心的等级', 1) :
				getAchieveString('最好的朋友', '与某人达到了10颗心的等级', 0) + (1 - count_10h) + ' 人';
		output += '</li>\n<li>';
		output += (count_10h >= 8) ? getAchieveString('深受喜爱的农夫', '与8个人达到了10颗心的等级', 1) :
				getAchieveString('深受喜爱的农夫', '与8个人达到了10颗心的等级', 0) + (8 - count_10h) + ' 人';
		output += '</li></ul></div>';
		table.push(output);

		saveInfo.perfectionTracker[umid]["Great Friends"] = { 'count' : maxed_count, 'total' : maxed_total };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink(maxed_count / maxed_total, true);
		}
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 与 ' + maxed_count + ' 人达到满友好度，总共有 ' + maxed_total +
				' 人' + pt_pct + '</span><br />';
		output += '<span class="explain">注: 所有可结婚对象满友好度为8&#x2665;</span><ul class="ach_list">\n';
		output += '<li>';
		output += (maxed_count >= maxed_total) ? getMilestoneString('与所有人达成满友好度', 1) :
				getMilestoneString('与所有人达成满友好度', 0) + (maxed_total - maxed_count) + ' 人';
		output += '</li></ul></div>';
		table.push(output);

		output = '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
		output += '<span class="result">' + farmer + ' 与每个人的友好度及事件</span><ul class="outer">';
		if (list_fam.length > 0) {
			output += '<li>家庭成员<ol class="compact">' + list_fam.sort().join('') + '</ol></li>\n';
		}
		if (list_bach.length > 0) {
			output += '<li>可约会村民<ol class="compact">' + list_bach.sort().join('') + '</ol></li>\n';
		}
		if (list_poly.length > 0) {
			output += '<li>群体10&#x2665;事件<ol class="compact">' + list_poly.sort().join('') + '</ol></li>\n';
		}
		if (list_other.length > 0) {
			output += '<li>其他村民<ol class="compact">' + list_other.sort().join('') + '</ol></li>\n';
		}
		output += '</ul></div>';
		meta.hasDetails = true; // this one always has details because of the friendship progress
		table.push(output);
		return table;
	}

	function parseFamily(xmlDoc, saveInfo) {
		var title = 'Home and Family',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];

			meta.wedding = Number($(xmlDoc).find('countdownToWedding').text());
			meta.isHost = true;

		table[0] = parsePlayerFamily($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			meta.isHost = false;
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerFamily(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerFamily(player, saveInfo, meta) {
		var output = '',
			table = [],
			needs = [],
			count = 0,
			maxUpgrades = (meta.isHost ? 3 : 2),
			houseType = (meta.isHost ? "FarmHouse" : "Cabin"),
			farmer = $(player).children('name').html(),
			spouse = $(player).children('spouse').html(),
			id = $(player).children('UniqueMultiplayerID').text(),
			children = '(None)',
			child_name = [],
			houseUpgrades = Number($(player).children('houseUpgradeLevel').text());
		if (typeof(id) === 'undefined' || id === '') {
			id = "0";
		}
		if (typeof(spouse) !== 'undefined' && spouse.length > 0) {
			if (meta.wedding > 0 && compareSemVer(saveInfo.version, "1.3") < 0) {
				spouse = spouse.slice(0,-7);
			}
			count++;
		} else if (saveInfo.partners.hasOwnProperty(id)) {
			spouse = saveInfo.players[saveInfo.partners[id]];
			count++;
		} else {
			spouse = '(无)';
			needs.push('配偶');
		}
		// Technically, we should be searching the Friendship data for RoommateMarriage here, but for now we are hardcoding
		var title = "配偶";
		if (spouse === "Krobus") {
			title = "室友"
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + " 的" + title + ": " + translateWord(spouse, "villager") + 
			((meta.wedding) ? ' -- 于 ' + meta.wedding + ' 日内结婚' : '') + '</span><br />\n';
		if (saveInfo.children.hasOwnProperty(id) && saveInfo.children[id].length > 0) {
			child_name = saveInfo.children[id];
			count += child_name.length;
		} else if (saveInfo.partners.hasOwnProperty(id) && saveInfo.children.hasOwnProperty(saveInfo.partners[id]) &&
					saveInfo.children[saveInfo.partners[id]].length > 0) {
			child_name = saveInfo.children[saveInfo.partners[id]];
			count += child_name.length;
		} else {
			$(player).parent().find("[" + saveInfo.ns_prefix + "\\:type='" + houseType + "'] NPC[" + saveInfo.ns_prefix + "\\:type='Child']").each(function () {
				count++;
				child_name.push($(this).find('name').html());
			});
		}
		if (child_name.length) {
			children = child_name.join(', ');
			if (child_name.length === 1) {
				needs.push("1 个孩子");
			}
		} else {
			needs.push("2 个孩子");
		}
		output += '<span class="result">' + farmer + " 的孩子: " + children + '</span><ul class="ach_list"><li>\n';
		output += (count >= 3) ? getAchieveString('浪漫满屋', '结婚并养育2个孩子', 1) :
				getAchieveString('浪漫满屋', '结婚并养育2个孩子', 0) + needs.join(' 和 ');
		output += '</li></ul></div>';
		table.push(output);
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + houseType + ' 已升级 ' + houseUpgrades + ' 次，最多 ';
		output += maxUpgrades + ' 次</span><br /><ul class="ach_list">\n';
		output += '<li>';
		output += (houseUpgrades >= 1) ? getAchieveString('节节高升', '升级你的房屋', 1) :
				getAchieveString('节节高升', '升级你的房屋', 0) + (1 - houseUpgrades) + ' 次升级';
		output += '</li>\n<li>';
		output += (houseUpgrades >= 2) ? getAchieveString('富裕生活', '将房屋升级至最大号（2次升级）', 1) :
				getAchieveString('富裕生活', '将房屋升级至最大号（2次升级）', 0) + (2 - houseUpgrades) + ' 次升级';
		output += '</li>\n<li>';
		output += (houseUpgrades >= maxUpgrades) ? getMilestoneString('完全升级房屋', 1) :
				getMilestoneString('完全升级房屋', 0) + (maxUpgrades - houseUpgrades) + ' 次升级';
		output += '</li></ul></div>';
		table.push(output);
		return table;
	}

	function parseCooking(xmlDoc, saveInfo) {
		var title = 'Cooking',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [],
			id;
			
			meta.recipes = {
				194: "Fried Egg",
				195: "Omelet",
				196: "Salad",
				197: "Cheese Cauliflower",
				198: "Baked Fish",
				199: "Parsnip Soup",
				200: "Vegetable Medley",
				201: "Complete Breakfast",
				202: "Fried Calamari",
				203: "Strange Bun",
				204: "Lucky Lunch",
				205: "Fried Mushroom",
				206: "Pizza",
				207: "Bean Hotpot",
				208: "Glazed Yams",
				209: "Carp Surprise",
				210: "Hashbrowns",
				211: "Pancakes",
				212: "Salmon Dinner",
				213: "Fish Taco",
				214: "Crispy Bass",
				215: "Pepper Poppers",
				216: "Bread",
				218: "Tom Kha Soup",
				219: "Trout Soup",
				220: "Chocolate Cake",
				221: "Pink Cake",
				222: "Rhubarb Pie",
				223: "Cookie",
				224: "Spaghetti",
				225: "Fried Eel",
				226: "Spicy Eel",
				227: "Sashimi",
				228: "Maki Roll",
				229: "Tortilla",
				230: "Red Plate",
				231: "Eggplant Parmesan",
				232: "Rice Pudding",
				233: "Ice Cream",
				234: "Blueberry Tart",
				235: "Autumn's Bounty",
				236: "Pumpkin Soup",
				237: "Super Meal",
				238: "Cranberry Sauce",
				239: "Stuffing",
				240: "Farmer's Lunch",
				241: "Survival Burger",
				242: "Dish O' The Sea",
				243: "Miner's Treat",
				244: "Roots Platter",
				456: "Algae Soup",
				457: "Pale Broth",
				604: "Plum Pudding",
				605: "Artichoke Dip",
				606: "Stir Fry",
				607: "Roasted Hazelnuts",
				608: "Pumpkin Pie",
				609: "Radish Salad",
				610: "Fruit Salad",
				611: "Blackberry Cobbler",
				612: "Cranberry Candy",
				618: "Bruschetta",
				648: "Coleslaw",
				649: "Fiddlehead Risotto",
				651: "Poppyseed Muffin",
				727: "Chowder",
				728: "Fish Stew",
				729: "Escargot",
				730: "Lobster Bisque",
				731: "Maple Bar",
				732: "Crab Cakes"
			};
			meta.recipeTranslate = {
				"Cheese Cauli.": "Cheese Cauliflower",
				"Cookies": "Cookie",
				"Cran. Sauce": "Cranberry Sauce",
				"Dish o' The Sea": "Dish O' The Sea",
				"Eggplant Parm.": "Eggplant Parmesan",
				"Vegetable Stew": "Vegetable Medley"
			};
			meta.recipeReverse = {};

		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			meta.recipes[733] = "Shrimp Cocktail";
			meta.recipes[253] = "Triple Shot Espresso";
			meta.recipes[265] = "Seafoam Pudding";
		}
		
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			meta.recipes[903] = "Ginger Ale";
			meta.recipes[904] = "Banana Pudding";
			meta.recipes[905] = "Mango Sticky Rice";
			meta.recipes[906] = "Poi";
			meta.recipes[907] = "Tropical Curry";
			meta.recipes[921] = "Squid Ink Ravioli";
		}

		for (id in meta.recipes) {
			if (meta.recipes.hasOwnProperty(id)) {
				meta.recipeReverse[meta.recipes[id]] = id;
			}
		}

		table[0] = parsePlayerCooking($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerCooking(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
		
	function parsePlayerCooking(player, saveInfo, meta) {
		/* cookingRecipes is keyed by name, but recipesCooked is keyed by ObjectInformation ID.
		 * Also, some cookingRecipes names are different from the names in ObjectInformation (e.g. Cookies vs Cookie) */
		var output = '',
			recipe_count = Object.keys(meta.recipes).length,
			known = {},
			known_count = 0,
			crafted = {},
			craft_count = 0,
			need_k = [],
			need_c = [],
			mod_known = 0,
			mod_craft = 0,
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			r;

		$(player).find('cookingRecipes > item').each(function () {
			var id = $(this).find('key > string').text(),
				num = Number($(this).find('value > int').text());
			if (meta.recipeTranslate.hasOwnProperty(id)) {
				id = meta.recipeTranslate[id];
			}
			if (meta.recipeReverse.hasOwnProperty(id)) {
				known[id] = num;
				known_count++;
			} else {
				mod_known++;
			}
		});
		$(player).find('recipesCooked > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > int').text());
			if (meta.recipes.hasOwnProperty(id)) {
				if (num > 0) {
					crafted[meta.recipes[id]] = num;
					craft_count++;
				}
			} else {
				if (num > 0) {
					mod_craft++;
				}
			}
		});

		saveInfo.perfectionTracker[umid]["Cooking"] = { 'count' : craft_count, 'total' : recipe_count };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink(craft_count / recipe_count, true);
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + " has cooked " + craft_count + ' and knows ' +
			known_count + ' of ' + recipe_count + ((mod_known > 0) ? " base game" : "") + ' recipes.' + pt_pct + '</span>\n';
		if (mod_known > 0) {
			output += '<br /><span class="result"><span class="note">' + $(player).children('name').html() + " has also cooked " +
				mod_craft + ' and knows ' + mod_known + " mod recipes (total unavailable).</span></span>\n";
		}
		output += '<ul class="ach_list"><li>';
		output += ( (craft_count + mod_craft) >= 10) ? getAchieveString('厨子', '做出10道不同的料理', 1) :
				getAchieveString('厨子', '做出10道不同的料理', 0) + (10 - craft_count - mod_craft) + ' 道';
		output += '</li>\n<li>';
		output += ( (craft_count + mod_craft) >= 25) ? getAchieveString('副主厨师', '做出25道不同的料理', 1) :
				getAchieveString('副主厨师', '做出25道不同的料理', 0) + (25 - craft_count - mod_craft) + ' 道';
		output += '</li>\n<li>';
		output += ( (craft_count + mod_craft) >= (recipe_count + mod_known) ) ? getAchieveString('美食大厨', '烹饪每种配方', 1) :
				getAchieveString('美食大厨', '烹饪每种配方', 0) + ((mod_known > 0) ? "至少 " : "") +
				(recipe_count + mod_known - craft_count - mod_craft) + ' 道';
		output += '</li></ul></div>';
		// We are assuming it is impossible to craft something without knowing the recipe.
		if ( (craft_count + mod_craft) < (recipe_count + mod_known) ) {
			for (id in meta.recipes) {
				if (meta.recipes.hasOwnProperty(id)) {
					r = meta.recipes[id];
					if (!known.hasOwnProperty(r)) {
						need_k.push('<li>' + wikify(r, undefined, undefined, "cooking") + '</li>');
					} else if (!crafted.hasOwnProperty(r)) {
						need_c.push('<li>' + wikify(r, undefined, undefined, "cooking") + '</li>');
					}
				}
			}
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未被烹饪:<ul>';
			if (need_c.length > 0) {
				output += '<li>已知菜谱<ol>' + need_c.sort().join('') + '</ol></li>\n';
			}
			if (need_k.length > 0) {
				output += '<li>未知菜谱<ol>' + need_k.sort().join('') + '</ol></li>\n';
			}
			if (mod_known > 0) {
				if (mod_craft >= mod_known) {
					output += '<li>Possibly additional mod recipes</li>';
				} else {
					output += '<li>Plus at least ' + (mod_known - mod_craft) + ' mod recipes</li>';
				}
			}
			output += '</ul></span></div>';
		}
		return [output];
	}

	function parseCrafting(xmlDoc, saveInfo) {
		/* Manually listing all crafting recipes in the order they appear on http://stardewvalleywiki.com/Crafting
		 * A translation is needed again because of text mismatch. */
		var title = 'Crafting',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			
			meta.recipes = ["Cherry Bomb", "Bomb", "Mega Bomb",
							"Gate", "Wood Fence", "Stone Fence", "Iron Fence", "Hardwood Fence",
							"Sprinkler", "Quality Sprinkler", "Iridium Sprinkler",
							"Mayonnaise Machine", "Bee House", "Preserves Jar", "Cheese Press", "Loom", "Keg", "Oil Maker", "Cask",
							"Basic Fertilizer", "Quality Fertilizer", "Speed-Gro", "Deluxe Speed-Gro",
							"Basic Retaining Soil", "Quality Retaining Soil",
							"Wild Seeds (Sp)", "Wild Seeds (Su)", "Wild Seeds (Fa)", "Wild Seeds (Wi)", "Ancient Seeds",
							"Wood Floor", "Straw Floor", "Weathered Floor", "Crystal Floor", "Stone Floor",
							"Wood Path", "Gravel Path", "Cobblestone Path", "Stepping Stone Path", "Crystal Path",
							"Spinner", "Trap Bobber", "Cork Bobber", "Treasure Hunter", "Dressed Spinner", "Barbed Hook",
							"Magnet", "Bait", "Wild Bait", "Crab Pot",
							"Sturdy Ring", "Warrior Ring", "Ring of Yoba", "Iridium Band",
							"Field Snack", "Life Elixir", "Oil of Garlic",
							"Torch", "Campfire", "Wooden Brazier", "Stone Brazier", "Gold Brazier", "Carved Brazier",
							"Stump Brazier", "Barrel Brazier", "Skull Brazier", "Marble Brazier", "Wood Lamp-post",
							"Iron Lamp-post", "Jack-O-Lantern",
							"Chest", "Furnace", "Scarecrow", "Seed Maker", "Staircase", "Explosive Ammo",
							"Transmute (Fe)", "Transmute (Au)",
							"Crystalarium", "Charcoal Kiln", "Lightning Rod", "Recycling Machine", "Tapper", "Worm Bin",
							"Slime Egg-Press", "Slime Incubator", "Warp Totem: Beach", "Warp Totem: Mountains", "Warp Totem: Farm",
							"Rain Totem", "Tub o' Flowers", "Wicked Statue", "Flute Block", "Drum Block" ];
			meta.recipeTranslate = {
				"Oil Of Garlic": "Oil of Garlic"
			};

		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			// Wedding Ring is specifically excluded in StardewValley.Stats.checkForCraftingAchievments() so it is not listed here.
			meta.recipes.push('Wood Sign', 'Stone Sign', 'Garden Pot');
		}
		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			meta.recipes.push('Brick Floor', 'Grass Starter', 'Deluxe Scarecrow', 'Mini-Jukebox', 'Tree Fertilizer', 'Tea Sapling', 'Warp Totem: Desert');
		}
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			meta.recipes.push("Rustic Plank Floor", "Stone Walkway Floor", "Fairy Dust", "Bug Steak", "Dark Sign", "Quality Bobber", "Stone Chest", "Monster Musk", "Mini-Obelisk", "Farm Computer", "Ostrich Incubator", "Geode Crusher", "Fiber Seeds", "Solar Panel", "Bone Mill", "Warp Totem: Island", "Thorns Ring", "Glowstone Ring", "Heavy Tapper", "Hopper", "Magic Bait", "Hyper Speed-Gro", "Deluxe Fertilizer", "Deluxe Retaining Soil", "Cookout Kit");
		}

		table[0] = parsePlayerCrafting($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerCrafting(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerCrafting(player, saveInfo, meta) {
		var output = '',
			recipe_count,
			known = {},
			known_count = 0,
			craft_count = 0,
			need_k = [],
			need_c = [],
			mod_known = 0,
			mod_craft = 0,
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			r;

		recipe_count = meta.recipes.length;
		$(player).find('craftingRecipes > item').each(function () {
			var id = $(this).find('key > string').text(),
				num = Number($(this).find('value > int').text());
			if (meta.recipeTranslate.hasOwnProperty(id)) {
				id = meta.recipeTranslate[id];
			}
			if (id === 'Wedding Ring') {
				return true;
			}
			if (meta.recipes.indexOf(id) === -1) {
				mod_known++;
				if (num > 0) {
					mod_craft++
				}
				return true;
			}
			known[id] = num;
			known_count++;
			if (num > 0) {
				craft_count++;
			} else {
				need_c.push('<li>' + wikify(id, undefined, undefined, 'crafting') + '</li>');
			}
		});

		saveInfo.perfectionTracker[umid]["Crafting"] = { 'count' : craft_count, 'total' : recipe_count };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink(craft_count / recipe_count, true);
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + " 已经制作过 " + craft_count + ' 种物品，了解 ' +
			known_count + ' 种物品的制作方法，总计有 ' + recipe_count + ' 种物品' + pt_pct + '</span>\n';
		if (mod_known > 0) {
			output += '<br /><span class="result"><span class="note">' + $(player).children('name').html() + " 同时制作过 " +
				mod_craft + ' 种mod物品，了解 ' + mod_known + " 种mod物品的制作方法(总数无法统计).</span></span>\n";
		}
		output += '<ul class="ach_list"><li>';
		output += ( (craft_count + mod_craft) >= 15) ? getAchieveString('自己动手', '制作15个不同的物品', 1) :
				getAchieveString('自己动手', '制作15个不同的物品', 0) + (15 - craft_count - mod_craft) + ' 种';
		output += '</li>\n<li>';
		output += ( (craft_count + mod_craft) >= 30) ? getAchieveString('工匠', '制作30个不同的物品', 1) :
				getAchieveString('工匠', '制作30个不同的物品', 0) + (30 - craft_count - mod_craft) + ' 种';
		output += '</li>\n<li>';
		output += ( (craft_count + mod_craft) >= (recipe_count + mod_known) ) ? getAchieveString('制造大师', '制造每种物品', 1) :
				getAchieveString('制造大师', '制造每种物品', 0) + ((mod_known > 0) ? "至少 " : "") +
				(recipe_count + mod_known - craft_count - mod_craft) + ' 种';
		output += '</li></ul></div>';
		if ( (craft_count + mod_craft) < (recipe_count + mod_known) ) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未被制作:<ul>';

			if (need_c.length > 0) {
				output += '<li>已知方法，尚未制作<ol>' + need_c.sort().join('') + '</ol></li>\n';
			}

			if (known_count < recipe_count) {
				need_k = [];
				for (id in meta.recipes) {
					if (meta.recipes.hasOwnProperty(id)) {
						r = meta.recipes[id];
						if (!known.hasOwnProperty(r)) {
							need_k.push('<li>' + wikify(r, undefined, undefined, 'crafting') + '</li>');
						}
					}
				}
				output += '<li>未知方法<ol>' + need_k.sort().join('') + '</ol></li>';
			}
			if (mod_known > 0) {
				if (mod_craft >= mod_known) {
					output += '<li>Possibly additional mod recipes</li>';
				} else {
					output += '<li>Plus at least ' + (mod_known - mod_craft) + ' mod recipes</li>';
				}
			}
			output += '</ul></span></div>';
		}
		return [output];
	}

	function parseFishing(xmlDoc, saveInfo) {
		var title = 'Fishing',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			meta.recipes = {
				// "Fish" category
				152: "Seaweed",
				153: "Green Algae",
				157: "White Algae",
				// "Fish -4" category
				128: "Pufferfish",
				129: "Anchovy",
				130: "Tuna",
				131: "Sardine",
				132: "Bream",
				136: "Largemouth Bass",
				137: "Smallmouth Bass",
				138: "Rainbow Trout",
				139: "Salmon",
				140: "Walleye",
				141: "Perch",
				142: "Carp",
				143: "Catfish",
				144: "Pike",
				145: "Sunfish",
				146: "Red Mullet",
				147: "Herring",
				148: "Eel",
				149: "Octopus",
				150: "Red Snapper",
				151: "Squid",
				154: "Sea Cucumber",
				155: "Super Cucumber",
				156: "Ghostfish",
				158: "Stonefish",
				159: "Crimsonfish",
				160: "Angler",
				161: "Ice Pip",
				162: "Lava Eel",
				163: "Legend",
				164: "Sandfish",
				165: "Scorpion Carp",
				682: "Mutant Carp",
				698: "Sturgeon",
				699: "Tiger Trout",
				700: "Bullhead",
				701: "Tilapia",
				702: "Chub",
				704: "Dorado",
				705: "Albacore",
				706: "Shad",
				707: "Lingcod",
				708: "Halibut",
				715: "Lobster",
				716: "Crayfish",
				717: "Crab",
				718: "Cockle",
				719: "Mussel",
				720: "Shrimp",
				721: "Snail",
				722: "Periwinkle",
				723: "Oyster",
				734: "Woodskip",
				775: "Glacierfish",
				795: "Void Salmon",
				796: "Slimejack"
			};
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			meta.recipes[798] = 'Midnight Squid';
			meta.recipes[799] = 'Spook Fish';
			meta.recipes[800] = 'Blobfish';
		}
		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			meta.recipes[269] = 'Midnight Carp';
			meta.recipes[267] = 'Flounder';
		}
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			meta.recipes[836] = 'Stingray';
			meta.recipes[837] = 'Lionfish';
			meta.recipes[838] = 'Blue Discus';
			// Ones which don't count for collection/achieve must be commented out; we may look at handling them later
			//meta.recipes[898] = 'Son of Crimsonfish';
			//meta.recipes[899] = 'Ms. Angler';
			//meta.recipes[900] = 'Legend II';
			//meta.recipes[901] = 'Radioactive Carp';
			//meta.recipes[902] = 'Glacierfish Jr.';
		}
		table[0] = parsePlayerFishing($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerFishing(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
	
	function parsePlayerFishing(player, saveInfo, meta) {
		// Much of the logic was ported from the crafting function which is why the variables are weirdly named
		var output = '',
			recipe_count = Object.keys(meta.recipes).length,
			count = 0,
			craft_count = 0, // for fish types
			mod_count = 0,
			known = [],
			need = [],
			ignore = { // Things you can catch that aren't counted in fishing achieve
				372: 1, // Clam is category "Basic -23"
				308: 1, // Void Mayo can be caught in Witch's Swamp during "Goblin Problems"
				79: 1,  // Secret Notes can be caught directly
				797: 1, // Pearl can be caught directly in Night Market Submarine
				191: 1, // Ornate necklace, from secret note quest added in 1.4
				103: 1, // Ancient doll, can be caught on 4 corners once after viewing the "doving" TV easter egg
				73: 1,  // 1.5 Golden Walnuts
				842: 1, // 1.5 Journal Scraps
				821: 1, // 1.5 Fossilized Spine
				825: 1, // 1.5 Snake Skull
				890: 1, // 1.5 Qi Bean
				898: 1, // 1.5 "Extended Family" Legendary -- Son of Crimsonfish
				899: 1, // 1.5 "Extended Family" Legendary -- Ms. Angler
				900: 1, // 1.5 "Extended Family" Legendary -- Legend II
				901: 1, // 1.5 "Extended Family" Legendary -- Radioactive Carp
				902: 1, // 1.5 "Extended Family" Legendary -- Glacierfish Jr.
				388: 1, // 1.5 Town Fountain Wood
				390: 1, // 1.5 Town Fountain Stone
				2332: 1, // 1.5 Special Furniture
				2334: 1, // 1.5 Special Furniture
				2396: 1, // 1.5 Special Furniture
				2418: 1, // 1.5 Special Furniture
				2419: 1, // 1.5 Special Furniture
				2421: 1, // 1.5 Special Furniture
				2423: 1, // 1.5 Special Furniture
				2425: 1, // 1.5 Special Furniture
				2427: 1, // 1.5 Special Furniture
				2428: 1, // 1.5 Special Furniture
				2732: 1, // 1.5 Special Furniture
				2814: 1, // 1.5 Special Furniture
			},
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			r;

		$(player).find('fishCaught > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > ArrayOfInt > int').first().text());
			if (!ignore.hasOwnProperty(id) && num > 0) {
				// We are adding up the count ourselves, but the total is also stored in (stats > fishCaught) and (stats > FishCaught)
				count += num;
				if (meta.recipes.hasOwnProperty(id)) {
					craft_count++;
					known[meta.recipes[id]] = num;
				} else {
					console.log("Mod fish? ID =" + id);
					mod_count++;
				}
			}
		});

		saveInfo.perfectionTracker[umid]["Fishing"] = { 'count' : craft_count, 'total' : recipe_count };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink(craft_count / recipe_count, true);
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + ' 成功钓鱼 ' + count +
			' 次，钓上了 ' + craft_count + ' 种不同鱼，总计有 ' + recipe_count + ' 种' + pt_pct +
			'</span>';
		if (mod_count > 0) {
			output += '<br /><span class="result note">' + $(player).children('name').html() + " 同时成功钓上 " +
				mod_count + " 种不同的mod中的鱼 (总数无法计算)</span>";
		}
		output += '<ul class="ach_list"><li>';
		output += (count >= 100) ? getAchieveString('捕鱼大师', '抓住100条鱼', 1) :
				getAchieveString('捕鱼大师', '抓住100条鱼', 0) + (100 - count) + ' 条';
		output += '</li>\n<li>';
		output += (craft_count >= 10) ? getAchieveString('渔夫', '抓住10种不同的鱼', 1) :
				getAchieveString('渔夫', '抓住10种不同的鱼', 0) + (10 - craft_count) + ' 种';
		output += '</li>\n<li>';
		output += (craft_count >= 24) ? getAchieveString('老海员', '抓住24种不同的鱼', 1) :
				getAchieveString('老海员', '抓住24种不同的鱼', 0) + (24 - craft_count) + ' 种';
		output += '</li>\n<li>';
		// 1.5 has some new fish that are ignored, but the logic has not changed.
		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			output += (craft_count >= recipe_count) ? getAchieveString('垂钓大师', '抓住各种不同的鱼', 1) :
					getAchieveString('垂钓大师', '抓住各种不同的鱼', 0) + (recipe_count - craft_count) + ' 种';
		} else {
			output += (craft_count >= Math.min(59, recipe_count)) ? getAchieveString('垂钓大师', '抓住各种不同的鱼', 1) :
					getAchieveString('垂钓大师', '抓住各种不同的鱼', 0) + (Math.min(59, recipe_count) - craft_count) + ' 种';
			if (compareSemVer(saveInfo.version, "1.3") === 0) {
				output += '</li>\n<li>';
				output += (craft_count >= recipe_count) ? getMilestoneString('抓住各种不同的鱼', 1) :
					getMilestoneString('抓住各种不同的鱼', 0) + (recipe_count - craft_count) + ' 种';				
			}
		}
		
		output += '</li></ul></div>';
		if (craft_count < recipe_count) {
			need = [];
			for (id in meta.recipes) {
				if (meta.recipes.hasOwnProperty(id)) {
					r = meta.recipes[id];
					if (!known.hasOwnProperty(r)) {
						need.push('<li>' + wikify(r, undefined, undefined, undefined) + '</li>');
					}
				}
			}
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未被钓起的鱼:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		return [output];
	}

	function parseBasicShipping(xmlDoc, saveInfo) {
		/* Basic shipping achieve details are not easy to pull from decompiled source -- lots of filtering of
		 * ObjectInformation in StardewValley.Utility.hasFarmerShippedAllItems() with additional calls to
		 * StardewValley.Object.isPotentialBasicShippedCategory().
		 * For now, we will simply assume it matches the Collections page and hardcode everything there
		 * using wiki page http://stardewvalleywiki.com/Collections as a guideline. */
		var title = 'Basic Shipping',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			meta.recipes = {
				16: "Wild Horseradish",
				18: "Daffodil",
				20: "Leek",
				22: "Dandelion",
				24: "Parsnip",
				78: "Cave Carrot",
				88: "Coconut",
				90: "Cactus Fruit",
				92: "Sap",
				174: "Large Egg (White)",
				176: "Egg (White)",
				180: "Egg (Brown)",
				182: "Large Egg (Brown)",
				184: "Milk",
				186: "Large Milk",
				188: "Green Bean",
				190: "Cauliflower",
				192: "Potato",
				248: "Garlic",
				250: "Kale",
				252: "Rhubarb",
				254: "Melon",
				256: "Tomato",
				257: "Morel",
				258: "Blueberry",
				259: "Fiddlehead Fern",
				260: "Hot Pepper",
				262: "Wheat",
				264: "Radish",
				266: "Red Cabbage",
				268: "Starfruit",
				270: "Corn",
				272: "Eggplant",
				274: "Artichoke",
				276: "Pumpkin",
				278: "Bok Choy",
				280: "Yam",
				281: "Chanterelle",
				282: "Cranberries",
				283: "Holly",
				284: "Beet",
				296: "Salmonberry",
				300: "Amaranth",
				303: "Pale Ale",
				304: "Hops",
				305: "Void Egg",
				306: "Mayonnaise",
				307: "Duck Mayonnaise",
				308: "Void Mayonnaise",
				330: "Clay",
				334: "Copper Bar",
				335: "Iron Bar",
				336: "Gold Bar",
				337: "Iridium Bar",
				338: "Refined Quartz",
				340: "Honey",
				342: "Pickles",
				344: "Jelly",
				346: "Beer",
				348: "Wine",
				350: "Juice",
				372: "Clam",
				376: "Poppy",
				378: "Copper Ore",
				380: "Iron Ore",
				382: "Coal",
				384: "Gold Ore",
				386: "Iridium Ore",
				388: "Wood",
				390: "Stone",
				392: "Nautilus Shell",
				393: "Coral",
				394: "Rainbow Shell",
				396: "Spice Berry",
				397: "Sea Urchin",
				398: "Grape",
				399: "Spring Onion",
				400: "Strawberry",
				402: "Sweet Pea",
				404: "Common Mushroom",
				406: "Wild Plum",
				408: "Hazelnut",
				410: "Blackberry",
				412: "Winter Root",
				414: "Crystal Fruit",
				416: "Snow Yam",
				417: "Sweet Gem Berry",
				418: "Crocus",
				420: "Red Mushroom",
				421: "Sunflower",
				422: "Purple Mushroom",
				424: "Cheese",
				426: "Goat Cheese",
				428: "Cloth",
				430: "Truffle",
				432: "Truffle Oil",
				433: "Coffee Bean",
				436: "Goat Milk",
				438: "Large Goat Milk",
				440: "Wool",
				442: "Duck Egg",
				444: "Duck Feather",
				446: "Rabbit's Foot",
				454: "Ancient Fruit",
				459: "Mead",
				591: "Tulip",
				593: "Summer Spangle",
				595: "Fairy Rose",
				597: "Blue Jazz",
				613: "Apple",
				634: "Apricot",
				635: "Orange",
				636: "Peach",
				637: "Pomegranate",
				638: "Cherry",
				684: "Bug Meat",
				709: "Hardwood",
				724: "Maple Syrup",
				725: "Oak Resin",
				726: "Pine Tar",
				766: "Slime",
				767: "Bat Wing",
				768: "Solar Essence",
				769: "Void Essence",
				771: "Fiber",
				787: "Battery Pack"
			};
		
		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			meta.recipes[807] = "Dinosaur Mayonnaise";
			meta.recipes[812] = "Roe";
			meta.recipes[445] = "Caviar";
			meta.recipes[814] = "Squid Ink";
			meta.recipes[815] = "Tea Leaves";
			meta.recipes[447] = "Aged Roe";
			meta.recipes[614] = "Green Tea";
			meta.recipes[271] = "Unmilled Rice";
		}
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			// Note: Qi Fruit (889) is specifically excluded by Object.isIndexOkForBasicShippedCategory()
			meta.recipes[91] = "Banana";
			meta.recipes[289] = "Ostrich Egg";
			meta.recipes[829] = "Ginger";
			meta.recipes[830] = "Taro Root";
			meta.recipes[832] = "Pineapple";
			meta.recipes[834] = "Mango";
			meta.recipes[848] = "Cinder Shard";
			meta.recipes[851] = "Magma Cap";
			meta.recipes[881] = "Bone Fragment";
			meta.recipes[909] = "Radioactive Ore";
			meta.recipes[910] = "Radioactive Bar";
		}
		table[0] = parsePlayerBasicShipping($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerBasicShipping(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
	
	function parsePlayerBasicShipping(player, saveInfo, meta) {
		// Much of the logic was ported from the crafting function which is why the variables are weirdly named
		var output = '',
			recipe_count = Object.keys(meta.recipes).length,
			crafted = {},
			craft_count = 0,
			need = [],
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			r;

		$(player).find('basicShipped > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > int').text());
			if (meta.recipes.hasOwnProperty(id) && num > 0) {
				crafted[meta.recipes[id]] = num;
				craft_count++;
			}
		});

		saveInfo.perfectionTracker[umid]["Shipping"] = { 'count' : craft_count, 'total' : recipe_count };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink(craft_count / recipe_count, true);
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + ' 已经售卖过 ' + craft_count +
				' 种物品，总共有 ' + recipe_count + ' 种' + pt_pct + '</span><ul class="ach_list">\n';
		output += '<li>';
		output += (craft_count >= recipe_count) ? getAchieveString('全部货物', '寄出每一种物品', 1) :
				getAchieveString('全部货物', '寄出每一种物品', 0) + (recipe_count - craft_count) + ' 种';
		output += '</li></ul></div>';
		if (craft_count < recipe_count) {
			need = [];
			for (id in meta.recipes) {
				if (meta.recipes.hasOwnProperty(id)) {
					r = meta.recipes[id];
					if (!crafted.hasOwnProperty(r)) {
						need.push('<li>' + wikify(r, undefined, undefined, "shipping") + '</li>');
					}
				}
			}
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未被售卖过的物品:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		return [output];
	}

	function parseCropShipping(xmlDoc, saveInfo) {
		// Relevant IDs were pulled from decompiled source - StardewValley.Stats.checkForShippingAchievments()
		// Note that there are 5 more "crops" for Monoculture than there are for Polyculture
		var title = 'Crop Shipping',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];

			meta.poly_crops = {
				// Some, but not all of "Basic -75" category (All veg except fiddlehead)
				24: "Parsnip",
				188: "Green Bean",
				190: "Cauliflower",
				192: "Potato",
				248: "Garlic",
				250: "Kale",
				256: "Tomato",
				262: "Wheat",
				264: "Radish",
				266: "Red Cabbage",
				270: "Corn",
				272: "Eggplant",
				274: "Artichoke",
				276: "Pumpkin",
				278: "Bok Choy",
				280: "Yam",
				284: "Beet",
				300: "Amaranth",
				304: "Hops",
				// Some, but not all of "Basic -79" category (All fruit except Ancient, tree & forageables)
				252: "Rhubarb",
				254: "Melon",
				258: "Blueberry",
				260: "Hot Pepper",
				268: "Starfruit",
				282: "Cranberries",
				398: "Grape",
				400: "Strawberry",
				// Others
				433: "Coffee Bean"
			};
			meta.mono_extras = {
				// Ancient Fruit and 4 of the "Basic -80" flowers
				454: "Ancient Fruit",
				591: "Tulip",
				593: "Summer Spangle",
				595: "Fairy Rose",
				597: "Blue Jazz"
			};
			
		table[0] = parsePlayerCropShipping($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerCropShipping(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
	
	function parsePlayerCropShipping(player, saveInfo, meta) {
		// Much of the logic was ported from the crafting function which is why the variables are weirdly named
		var output = '',
			recipe_count = Object.keys(meta.poly_crops).length,
			crafted = {},
			craft_count = 0,
			max_ship = 0,
			max_crop = "of any crop",
			need = [],
			id,
			r,
			n,
			farmer = $(player).children('name').html();

		$(player).find('basicShipped > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > int').text());
			if (meta.poly_crops.hasOwnProperty(id)) {
				crafted[meta.poly_crops[id]] = num;
				if (num >= 15) {
					craft_count++;
				}
				if (num > max_ship) {
					max_ship = num;
					max_crop = meta.poly_crops[id];
				}
			} else if (meta.mono_extras.hasOwnProperty(id)) {
				if (num > max_ship) {
					max_ship = num;
					max_crop = meta.mono_extras[id];
				}
			}
		});

		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += (max_ship > 0) ? '<span class="result">' + farmer + ' 卖出 ' + translateWord(max_crop, "shipping") + ' 数量最多 (' + max_ship + ').</span>' :
				'<span class="result">' + farmer + ' 还没有卖出过任何农作物</span>';
		output += '<ul class="ach_list"><li>\n';
		output += (max_ship >= 300) ? getAchieveString('单一栽培', '运送 300 份一种作物', 1) :
				getAchieveString('单一栽培', '运送 300 份一种作物', 0) + max_crop + ' ' + (300 - max_ship) + " 份";
		output += '</li></ul>\n';
		output += '<span class="result">' + farmer + ' 有 ' + craft_count + ' 种农作物已经卖出了 15 份，总共有 ' +
				recipe_count + ' 种不同农作物</span><ul class="ach_list">\n<li>';
		output += (craft_count >= recipe_count) ? getAchieveString('混合栽培', '运送 15 份每种作物', 1) :
				getAchieveString('混合栽培', '运送 15 份每种作物', 0) + (recipe_count - craft_count) + ' 种不同农作物';
		output += '</li></ul></div>';
		if (craft_count < recipe_count) {
			need = [];
			for (id in meta.poly_crops) {
				if (meta.poly_crops.hasOwnProperty(id)) {
					r = meta.poly_crops[id];
					if (!crafted.hasOwnProperty(r)) {
						need.push('<li>' + wikify(r, undefined, undefined, "shipping") + ' -- 还需要 15 份</li>');
					} else {
						n = Number(crafted[r]);
						if (n < 15) {
							need.push('<li>' + wikify(r, undefined, undefined, "shipping") + ' --' + ' 还需要 ' + (15 - n) + ' 份</li>');
						}
					}
				}
			}
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未达到售卖数量农作物:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		return [output];
	}

	function parseSkills(xmlDoc, saveInfo) {
		var title = 'Skills',
			output = '',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			
			meta.skills = ["Farming", "Fishing", "Foraging", "Mining", "Combat"],
			meta.next_level = [100,380,770,1300,2150,3300,4800,6900,10000,15000];
			
		table[0] = parsePlayerSkills($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerSkills(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
	
	function parsePlayerSkills(player, saveInfo, meta) {
		var output = '',
			xp = {},
			i = 0,
			j,
			level = 10,
			num,
			count = 0,
			umid = $(player).children('UniqueMultiplayerID').text(),
			isMale = ($(player).children('isMale').text() === "true"),
			pt_pct = '',
			pt_level = 0,
			title = '',
			need = [];

		$(player).find('experiencePoints > int').each(function () {
			// We need to skip the unused 6th entry (Luck)
			if (i < 5) {
				num = Number($(this).text());
				xp[meta.skills[i]] = num;
				// The current skill levels are also stored separately in 'player > fishingLevel' (and similar)
				if (num < 15000) {
					for (j = 0; j < 10; j++) {
						if (meta.next_level[j] > num) {
							level = j;
							break;
						}
					}
                    need.push('<li>' + wikify(meta.skills[i], undefined, undefined, "skill") + ' (level ' + level + ') -- 需要 ' + 
						addCommas(meta.next_level[level] - num) + ' 经验达到下一等级， ' + addCommas(15000 - num) + ' 经验达到满级</li>\n');
				} else {
					count++;
				}
				i++;
			}
		});

		// We could tally this up while we are checking the xp values, but since we need to account for Luck anyway, we might
		//  as well just directly calculate this the same way the game does.
		pt_level = Math.floor((Number($(player).find('farmingLevel').text()) + Number($(player).find('miningLevel').text()) +
					Number($(player).find('combatLevel').text()) + Number($(player).find('foragingLevel').text()) +
					Number($(player).find('fishingLevel').text()) + Number($(player).find('luckLevel').text()))/2);
		saveInfo.perfectionTracker[umid]["Skills"] = { 'count' : pt_level, 'total' : 25 };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink((pt_level / .25) + "%");
		}
		switch (pt_level) {
			case 0:
			case 1:
			case 2:
				title = "Newcomer"; break;
			case 3:
			case 4:
				title = "Greenhorn"; break;
			case 5:
			case 6:
				title = "Bumpkin"; break;
			case 7:
			case 8:
				title = "Cowpoke"; break;
			case 9:
			case 10:
				title = "Farmhand"; break;
			case 11:
			case 12:
				title = "Tiller"; break;
			case 13:
			case 14:
				title = "Smallholder"; break;
			case 15:
			case 16:
				title = "Sodbuster"; break;
			case 17:
			case 18:
				title = "Farm" + (isMale ? "boy" : "girl"); break;
			case 19:
			case 20:
				title = "Granger"; break;
			case 21:
			case 22:
				title = "Planter"; break;
			case 23:
			case 24:
				title = "Rancher"; break;
			case 25:
			case 26:
				title = "Farmer"; break;
			case 27:
			case 28:
				title = "Agriculturist"; break;
			case 29:
				title = "Cropmaster"; break;
			default:
				title = "Farm King";
		}
				
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() +
			' is <a href="https://stardewvalleywiki.com/Skills#Skill-Based_Title">Farmer Level</a> ' + pt_level + 
			' with title ' + title + '.' + pt_pct + '</span><br />';
		output += '<span class="result">' + $(player).children('name').html() + ' 在 ' + count + 
			' 项技能中达到了等级 10.</span><br />';
		output += '<ul class="ach_list"><li>';
		output += (count >= 1) ? getAchieveString('非凡天赋', '（一项）技能到达10级', 1) :
				getAchieveString('非凡天赋', '一项技能到达10级', 0) + (1 - count) + ' 项技能';
		output += '</li>\n<li>';
		output += (count >= 5) ? getAchieveString('5种技能大师', '每种技能都达到10级', 1) :
				getAchieveString('5种技能大师', '每种技能都达到10级', 0) + (5 - count) + ' 项技能';
		output += '</li></ul></div>';

		if (need.length > 0) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未满级技能:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		return [output];
	}

	function parseMuseum(xmlDoc, saveInfo) {
		var title = 'Museum Collection',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [],
			museum = $(xmlDoc).find("locations > GameLocation[" + saveInfo.ns_prefix + "\\:type='LibraryMuseum']");
			
			meta.artifacts = {
				96: "Dwarf Scroll I",
				97: "Dwarf Scroll II",
				98: "Dwarf Scroll III",
				99: "Dwarf Scroll IV",
				100: "Chipped Amphora",
				101: "Arrowhead",
				103: "Ancient Doll",
				104: "Elvish Jewelry",
				105: "Chewing Stick",
				106: "Ornamental Fan",
				107: "Dinosaur Egg",
				108: "Rare Disc",
				109: "Ancient Sword",
				110: "Rusty Spoon",
				111: "Rusty Spur",
				112: "Rusty Cog",
				113: "Chicken Statue",
				114: "Ancient Seed",
				115: "Prehistoric Tool",
				116: "Dried Starfish",
				117: "Anchor",
				118: "Glass Shards",
				119: "Bone Flute",
				120: "Prehistoric Handaxe",
				121: "Dwarvish Helm",
				122: "Dwarf Gadget",
				123: "Ancient Drum",
				124: "Golden Mask",
				125: "Golden Relic",
				126: "Strange Doll (green)",
				127: "Strange Doll (yellow)",
				579: "Prehistoric Scapula",
				580: "Prehistoric Tibia",
				581: "Prehistoric Skull",
				582: "Skeletal Hand",
				583: "Prehistoric Rib",
				584: "Prehistoric Vertebra",
				585: "Skeletal Tail",
				586: "Nautilus Fossil",
				587: "Amphibian Fossil",
				588: "Palm Fossil",
				589: "Trilobite"
			};
			meta.minerals = {
				60: "Emerald",
				62: "Aquamarine",
				64: "Ruby",
				66: "Amethyst",
				68: "Topaz",
				70: "Jade",
				72: "Diamond",
				74: "Prismatic Shard",
				80: "Quartz",
				82: "Fire Quartz",
				84: "Frozen Tear",
				86: "Earth Crystal",
				538: "Alamite",
				539: "Bixite",
				540: "Baryte",
				541: "Aerinite",
				542: "Calcite",
				543: "Dolomite",
				544: "Esperite",
				545: "Fluorapatite",
				546: "Geminite",
				547: "Helvite",
				548: "Jamborite",
				549: "Jagoite",
				550: "Kyanite",
				551: "Lunarite",
				552: "Malachite",
				553: "Neptunite",
				554: "Lemon Stone",
				555: "Nekoite",
				556: "Orpiment",
				557: "Petrified Slime",
				558: "Thunder Egg",
				559: "Pyrite",
				560: "Ocean Stone",
				561: "Ghost Crystal",
				562: "Tigerseye",
				563: "Jasper",
				564: "Opal",
				565: "Fire Opal",
				566: "Celestine",
				567: "Marble",
				568: "Sandstone",
				569: "Granite",
				570: "Basalt",
				571: "Limestone",
				572: "Soapstone",
				573: "Hematite",
				574: "Mudstone",
				575: "Obsidian",
				576: "Slate",
				577: "Fairy Stone",
				578: "Star Shards"
			};
			meta.donated = {};
			
			var	artifact_count = Object.keys(meta.artifacts).length,
			mineral_count = Object.keys(meta.minerals).length,
			donated_count = 0,
			museum_count = artifact_count + mineral_count;


		$(museum).find('museumPieces > item').each(function () {
			var id = Number($(this).find('value > int').text());
			if (meta.artifacts.hasOwnProperty(id) || meta.minerals.hasOwnProperty(id)) {
				meta.donated[id] = 1;
			}
		});
		donated_count = Object.keys(meta.donated).length;

		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		var intro;
		if (saveInfo.numPlayers > 1) {
			intro = '在 ' + $(xmlDoc).find('player > farmName').html(); + ' 农场的居民';
		} else {
			intro = $(xmlDoc).find('player > name').html();
		}
		output += '<span class="result">' + intro + ' 捐赠了 ' + donated_count + ' 种不同物品给博物馆，总共有 ' +
			museum_count + ' 种物品</span><ul class="ach_list">\n';
		output += '<li>';
		output += (donated_count >= 40) ? getAchieveString('无主宝藏', '向博物馆捐赠40种不同的物品', 1) :
				getAchieveString('无主宝藏', '向博物馆捐赠40种不同的物品', 0) + (40 - donated_count) + ' 种';
		output += '</li>\n<li>';
		output += (donated_count >= 60) ? getMilestoneString('捐赠足够的物品 (60) 来获得生锈的钥匙', 1) :
				getMilestoneString('捐赠足够的物品 (60) 来获得生锈的钥匙', 0) + (60 - donated_count) + ' 种';
		output += '</li>\n<li>';
		output += (donated_count >= museum_count) ? getAchieveString('全套收集', '完成博物馆收集', 1) :
				getAchieveString('全套收集', '完成博物馆收集', 0) + (museum_count - donated_count) + ' 种';
		output += '</li></ul></div>';
		if (donated_count < museum_count) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">下方是未被捐赠的物品详情:</span><br /><br /></div>';
		}
		
		table[0] = parsePlayerMuseum($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerMuseum(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + output + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerMuseum(player, saveInfo, meta) {
		var output = '',
			donated_count = Object.keys(meta.donated).length,
			artifact_count = Object.keys(meta.artifacts).length,
			mineral_count = Object.keys(meta.minerals).length,
			museum_count = artifact_count + mineral_count,
			found = {},
			found_art = 0,
			found_min = 0,
			need_art = [],
			need_min = [],
			need = [],
			id,
			r,
			farmer = $(player).children('name').html();
	
		$(player).find('archaeologyFound > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > ArrayOfInt > int').first().text());
			if (meta.artifacts.hasOwnProperty(id) && num > 0) {
				found[id] = num;
				found_art++;
			}
		});
		$(player).find('mineralsFound > item').each(function () {
			var id = $(this).find('key > int').text(),
				num = Number($(this).find('value > int').text());
			if (meta.minerals.hasOwnProperty(id) && num > 0) {
				found[id] = num;
				found_min++;
			}
		});

		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 找到了 ' + found_art + ' 种古物，总共有 ' + artifact_count + ' 种</span><br />\n';
		output += '<span class="result">' + farmer + ' 找到了 ' + found_min + ' 种矿石，总共有 ' + mineral_count +
			' 种</span><ul class="ach_list">\n';
		output += '<li>';
		output += '</li>\n<li>';
		output += (found_art >= artifact_count) ? getMilestoneString('找到所有种类的古物', 1) :
				getMilestoneString('找到所有的古物', 0) + (artifact_count - found_art) + ' 种';
		output += '</li>\n<li>';
		output += (found_min >= mineral_count) ? getMilestoneString('找到所有种类的矿石', 1) :
				getMilestoneString('找到所有的矿石', 0) + (mineral_count - found_min) + ' 种';
		output += '</li></ul></div>';

		if (donated_count < museum_count || (found_art + found_min) < museum_count) {
			for (id in meta.artifacts) {
				if (meta.artifacts.hasOwnProperty(id)) {
					r = meta.artifacts[id];
					need = [];
					if (!found.hasOwnProperty(id)) {
						need.push('找到');
					}
					if (!meta.donated.hasOwnProperty(id)) {
						need.push('捐赠');
					}
					if (need.length > 0) {
						need_art.push('<li>' + wikify(r, undefined, undefined, 'artifact') + ' -- 未被 ' + need.join("及") + '</li>');
					}
				}
			}
			for (id in meta.minerals) {
				if (meta.minerals.hasOwnProperty(id)) {
					r = meta.minerals[id];
					need = [];
					if (!found.hasOwnProperty(id)) {
						need.push('找到');
					}
					if (!meta.donated.hasOwnProperty(id)) {
						need.push('捐赠');
					}
					if (need.length > 0) {
						need_min.push('<li>' + wikify(r, undefined, undefined, 'mineral') + ' -- 未被 ' + need.join("及") + '</li>');
					}
				}
			}
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未捐赠物品:<ul>';
			if (need_art.length > 0) {
				output += '<li>古物<ol>' + need_art.sort().join('') + '</ol></li>\n';
			}
			if (need_min.length > 0) {
				output += '<li>矿石<ol>' + need_min.sort().join('') + '</ol></li>\n';
			}
			output += '</ul></span></div>';
		}
		
		return [output];
	}

	function parseMonsters(xmlDoc, saveInfo) {
		/* Conditions & details from decompiled source StardewValley.Locations.AdventureGuild.gil()
		 * The game counts some monsters which are not currently available; we will count them too
		 * just in case they are in someone's save file, but not list them in the details. */
		var title = 'Monster Hunting',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			meta.goals = {
				"Slimes": 1000,
				"Void Spirits": 150,
				"Bats": 200,
				"Skeletons": 50,
				"Cave Insects": 125,
				"Duggies": 30,
				"Dust Sprites": 500,
			};
			meta.categories = {
				"Green Slime": "Slimes",
				"Frost Jelly": "Slimes",
				"Sludge": "Slimes",
				"Shadow Brute": "Void Spirits",
				"Shadow Shaman": "Void Spirits",
				"Shadow Guy": "Void Spirits", // not in released game
				"Shadow Girl": "Void Spirits", // not in released game
				"Bat": "Bats",
				"Frost Bat": "Bats",
				"Lava Bat": "Bats",
				"Skeleton": "Skeletons",
				"Skeleton Mage": "Skeletons", // not in released game
				"Bug": "Cave Insects",
				"Fly": "Cave Insects", // wiki calls this "Cave Fly"
				"Grub": "Cave Insects",
				"Duggy": "Duggies",
				"Dust Spirit": "Dust Sprites"
			};
			meta.monsters = {
				"Slimes": ["Green Slime", "Frost Jelly", "Sludge"],
				"Void Spirits": ["Shadow Brute", "Shadow Shaman"],
				"Bats": ["Bat", "Frost Bat", "Lava Bat"],
				"Skeletons": ["Skeleton"],
				"Cave Insects": ["Bug", "Cave Fly", "Grub"],
				"Duggies": ["Duggy"],
				"Dust Sprites": ["Dust Spirit"]
			};
		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			meta.goals["Rock Crabs"] = 60;
			meta.goals["Mummies"] = 100;
			meta.goals["Pepper Rex"] = 50;
			meta.goals["Serpents"] = 250;
			meta.categories["Rock Crab"] = "Rock Crabs";
			meta.categories["Lava Crab"] = "Rock Crabs";
			meta.categories["Iridium Crab"] = "Rock Crabs";
			meta.categories["Mummy"] = "Mummies";
			meta.categories["Pepper Rex"] = "Pepper Rex";
			meta.categories["Serpent"] = "Serpents";
			meta.monsters["Rock Crabs"] = ["Rock Crab", "Lava Crab", "Iridium Crab"];
			meta.monsters["Mummies"] = ["Mummy"];
			meta.monsters["Pepper Rex"] = ["Pepper Rex"];
			meta.monsters["Serpents"] = ["Serpent"];
		}
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			meta.goals["Flame Spirits"] = 150;
			meta.categories["Magma Sprite"] = "Flame Spirits";
			meta.categories["Magma Sparker"] = "Flame Spirits";
			meta.monsters["Flame Spirits"] = ["Magma Sprite", "Magma Sparker"];
			meta.categories["Tiger Slime"] = "Slimes";
			meta.monsters["Slimes"].push("Tiger Slime");
			meta.categories["Shadow Sniper"] = "Void Spirits";
			meta.monsters["Void Spirits"].push("Shadow Sniper");
			// These are included now
			meta.categories["Magma Duggy"] = "Duggies";
			meta.monsters["Duggies"].push("Magma Duggy");
			meta.categories["Iridium Bat"] = "Bats";
			meta.monsters["Bats"].push("Iridium Bat");
			meta.categories["Royal Serpent"] = "Serpents";
			meta.monsters["Serpents"].push("Royal Serpent");
			// These exist now in hard mode so need to be included in output
			meta.monsters["Skeletons"].push("Skeleton Mage");
		}
		table[0] = parsePlayerMonsters($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerMonsters(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerMonsters(player, saveInfo, meta) {
		var output = '',
			table = [],
			goal_count = Object.keys(meta.goals).length,
			killed = [],
			completed = 0,
			need = [],
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			stats,
			mineLevel = Number($(player).children('deepestMineLevel').text()),
			hasSkullKey = $(player).children('hasSkullKey').text(),
			farmer = $(player).children('name').html();
			
		// Have seen some inconsitencies in multiplayer, so will use presence of skull key to override the level & bump it to 120.
		if (hasSkullKey === 'true') {
			mineLevel = Math.max(120, mineLevel);
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		if (mineLevel <= 0) {
			output += '<span class="result">' + farmer + ' 尚未探索过矿井。</span><br />\n';
		} else {
			output += '<span class="result">' + farmer + ' 已到达矿井第 ' + Math.min(mineLevel, 120) +
				' 层。</span><br />\n';
			output += '<span class="result">' + farmer + ((mineLevel > 120) ?
				(' 最深到达头骨山洞第 ' + (mineLevel - 120) + ' 层') :
				' 尚未探索过头骨山洞');
			output += '.</span></div>';
		}
		table.push(output);
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<ul class="ach_list"><li>\n';
		output += (mineLevel >= 120) ? getAchieveString('底部', '到达矿井的最底层。', 1) :
				getAchieveString('底部', '到达矿井的最底层。', 0) + (120 - mineLevel) + ' 层';
		output += '</li></ul></div>';
		
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			stats = $(player).find('stats > specificMonstersKilled');
		} else {
			// In 1.2, stats are under the root SaveGame so we must go back up the tree
			stats = $(player).parent().find('stats > specificMonstersKilled');
		}

		$(stats).children('item').each(function () {
			var id = $(this).find('key > string').text(),
				num = Number($(this).find('value > int').text()),
				old = 0;
			if (meta.categories.hasOwnProperty(id) && num > 0) {
				if (killed.hasOwnProperty(meta.categories[id])) {
					old = killed[meta.categories[id]];
				}
				killed[meta.categories[id]] = (old + num);
			}
		});
		for (id in meta.goals) {
			if (meta.goals.hasOwnProperty(id)) {
				if (killed.hasOwnProperty(id)) {
					if (killed[id] >= meta.goals[id]) {
						completed++;
					} else {
						// need.push('<li>' + id + ' -- 还需要击杀 ' + (meta.goals[id] - killed[id]) + ' 个: ' +
						// 	meta.monsters[id].map(wikimap).join(', ') + '</li>');
                        need.push('<li>' + translateWord(id, "monster") + ' -- 还需要击杀任意 ' + (meta.goals[id] - killed[id]) + ' 个: ' +
							meta.monsters[id].map((word) => wikify(word, undefined, undefined, "monster")).join(', ') + '</li>');
					}
				} else {
					// need.push('<li>' + id + ' -- 还需要击杀 ' + meta.goals[id] + ' 个: ' +
					// 	meta.monsters[id].map(wikimap).join(', ') + '</li>');
                    need.push('<li>' + translateWord(id, "monster") + ' -- 还需要击杀任意 ' + meta.goals[id] + ' 个: ' +
						meta.monsters[id].map((word) => wikify(word, undefined, undefined, "monster")).join(', ') + '</li>');
				}
			}
		}

		saveInfo.perfectionTracker[umid]["Monsters"] = (completed >= goal_count);
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink((completed >= goal_count) ? "已完成" : "未完成");
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 已经完成了 ' + completed + ' 个怪物狩猎任务，总计 ' + goal_count +
				' 个' + pt_pct + '</span><ul class="ach_list">\n';
		output += '<li>';
		output += (completed >= goal_count) ? getAchieveString('城镇守护者', '完成冒险公会猎人会长的全部任务', 1) :
				getAchieveString('城镇守护者', '完成冒险公会猎人会长的全部任务', 0) + (goal_count - completed) + ' 个任务';
		output += '</li></ul></div>';
		if (need.length > 0) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未完成任务:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		table.push(output);
		return table;
	}

	function parseQuests(xmlDoc, saveInfo) {
		var title = 'Quests',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			
		table[0] = parsePlayerQuests($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerQuests(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerQuests(player, saveInfo, meta) {
		var output = '',
			count;
			
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			count = Number($(player).find('stats > questsCompleted').text());
		} else {
			// In 1.2, stats are under the root SaveGame so we must go back up the tree
			count = Number($(player).parent().find('stats > questsCompleted').text());
		}

		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + ' 已经完成了 ' + count + ' 个“需要帮助” 任务。</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (count >= 10) ? getAchieveString('听差', '完成10个“需要帮助”任务', 1) :
				getAchieveString('听差', '完成10个“需要帮助”任务', 0) + (10 - count) + ' 个任务';
		output += '</li>\n<li>';
		output += (count >= 40) ? getAchieveString('帮了大忙', '完成40个“需要帮助”任务', 1) :
				getAchieveString('帮了大忙', '完成40个“需要帮助”任务', 0) + (40 - count) + ' 个任务';
		output += '</li></ul></div>';
		return [output];
	}

	function parseStardrops(xmlDoc, saveInfo) {
		/* mailReceived identifiers from decompiled source of StardewValley.Utility.foundAllStardrops()
		 * descriptions are not from anywhere else and are just made up. */
		var title = 'Stardrops',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			meta.stardrops = {
				'CF_Fair': '用2,000星币在星露谷集市购买',
				'CF_Mines': '矿洞一百层奖励获得',
				'CF_Spouse': '当你与伴侣的友谊达到12/14心时即有概率在对话时触发赠送，普遍数据为13/14心时获得，多人联机玩家之间结婚也会获得',
				'CF_Sewer': '科罗布斯以20,000g出售',
				'CF_Statue': '给秘密森林的老坎诺利大师一个宝石甜莓',
				'CF_Fish': '完成成就“垂钓大师”（钓上所有品种的鱼）后，从威利的信中获得',
				'museumComplete': '完成成就“完整收藏”（向博物馆捐出全部95种收藏）'
			};
			
		table[0] = parsePlayerStardrops($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerStardrops(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerStardrops(player, saveInfo, meta) {
		var output = '',
			count = 0,
			id,
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = '',
			need = [],
			received = {},
			stardrop_count = Object.keys(meta.stardrops).length;

		$(player).find('mailReceived > string').each(function () {
			var id = $(this).text();
			if (meta.stardrops.hasOwnProperty(id)) {
				count++;
				received[id] = 1;
			}
		});
		for (id in meta.stardrops) {
			if (meta.stardrops.hasOwnProperty(id)) {
				if (!received.hasOwnProperty(id)) {
					need.push('<li>' + meta.stardrops[id] + '</li>');
				}
			}
		}

		saveInfo.perfectionTracker[umid]["Stardrops"] = (count >= stardrop_count);
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			pt_pct = getPTLink((count >= stardrop_count) ? "已完成" : "未完成");
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + $(player).children('name').html() + ' 已经获得了 ' + stardrop_count + ' 个星之果实中的 ' + count +
				' 个。 '+ pt_pct + '</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (count >= stardrop_count) ? getAchieveString('星之果实的神秘', '找到所有星之果实', 1) :
				getAchieveString('星之果实的神秘', '找到所有星之果实', 0) + (stardrop_count - count) + ' 个';
		output += '</li></ul></div>';
		if (need.length > 0) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">剩余的星之果实:<ol>' + need.sort().join('') + '</ol></span></div>';
		}
		return [output];
	}

	function parseGrandpa(xmlDoc, saveInfo) {
		// Scoring details from StardewValley.Utility.getGradpaScore() & getGrandpaCandlesFromScore()
		var title = 'Grandpa\'s Evaluation',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			farmer = $(xmlDoc).find('player > name').html(),
			count = 0,
			max_count = 21,
			candles = 1,
			max_candles = 4,
			currentCandles = Number($(xmlDoc).find("locations > GameLocation[" + saveInfo.ns_prefix + "\\:type='Farm'] > grandpaScore").text()),
			need = '',
			money = Number($(xmlDoc).find('player > totalMoneyEarned').text()),
			achieves = {
				5: 'A Complete Collection',
				26: 'Master Angler',
				34: 'Full Shipment'
			},
			ach_count = 3,
			ach_have = {},
			cc_done = 0,
			ccRooms = {
				'ccBoilerRoom': "Boiler Room",
				'ccCraftsRoom': "Crafts Room",
				'ccPantry': "Pantry",
				'ccFishTank': "Fish Tank",
				'ccVault': "Vault",
				'ccBulletin': "Bulletin Board"
			},
			cc_have = 0,
			cc_count = 6,
			isJojaMember = 0,
			spouse = $(xmlDoc).find('player > spouse'), // will trigger during 3 day engagement too
			houseUpgrades = Number($(xmlDoc).find('player > houseUpgradeLevel').text()),
			hasRustyKey = $(xmlDoc).find('player > hasRustyKey').text(),
			hasSkullKey = $(xmlDoc).find('player > hasSkullKey').text(),
			hasKeys = [],
			heart_count = 0,
			hasPet = 0,
			petLove = 0,
			realPlayerLevel = (Number($(xmlDoc).find('player > farmingLevel').text()) +
								Number($(xmlDoc).find('player > miningLevel').text()) +
								Number($(xmlDoc).find('player > combatLevel').text()) +
								Number($(xmlDoc).find('player > foragingLevel').text()) +
								Number($(xmlDoc).find('player > fishingLevel').text()) +
								Number($(xmlDoc).find('player > luckLevel').text())),
			playerLevel = realPlayerLevel / 2;

		// Pre-calculating totals to put summary info up top.
		if (money >= 1e6) {
			count += 7;
		} else if (money >= 5e5) {
			count += 5;
		} else if (money >= 3e5) {
			count += 4;
		} else if (money >= 2e5) {
			count += 3;
		} else if (money >= 1e5) {
			count += 2;
		} else if (money >= 5e4) {
			count += 1;
		}
		$(xmlDoc).find('player > achievements > int').each(function () {
			var id = $(this).text();
			if (achieves.hasOwnProperty(id)) {
				count++;
				ach_have[id] = 1;
			}
		});
		$(xmlDoc).find('player > eventsSeen > int').each(function () {
			if ($(this).text() === '191393') {
				cc_done = 1;
			}
		});
		if (cc_done) {
			count += 3;
		} else {
			$(xmlDoc).find('player > mailReceived > string').each(function () {
				var id = $(this).text();
				if (id === 'JojaMember') {
					isJojaMember = 1;
				} else if (ccRooms.hasOwnProperty(id)) {
					cc_have++;
				}
			});
			if (cc_have >= cc_count) {
				count++;
			}
		}
		if (hasRustyKey === 'true') {
			count++;
			// hasKeys.push('Rusty Key');
            hasKeys.push('生锈的钥匙');
		}
		if (hasSkullKey === 'true') {
			count++;
			// hasKeys.push('Skull Key');
            hasKeys.push('头骨钥匙');
		}
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			var	uid = $(xmlDoc).find('player').children('UniqueMultiplayerID').text();
			if (saveInfo.partners.hasOwnProperty(uid)) {
				spouse = saveInfo.players[saveInfo.partners[uid]];
			}
		}			
		if (spouse.length > 0 && houseUpgrades >= 2) {
			count++;
		}
		if (compareSemVer(saveInfo.version, "1.3") >= 0) {
			$(xmlDoc).find('player> friendshipData > item').each(function () {
				var num = Number($(this).find('value > Friendship > Points').text());
				if (num >= 1975) { heart_count++; }
			});
		} else {
			$(xmlDoc).find('player> friendships > item').each(function () {
				var num = Number($(this).find('value > ArrayOfInt > int').first().text());
				if (num >= 1975) { heart_count++; }
			});
		}
		if (heart_count >= 10) {
			count += 2;
		} else if (heart_count >= 5) {
			count += 1;
		}
		if (playerLevel >= 25) {
			count += 2;
		} else if (playerLevel >= 15) {
			count += 1;
		}
		$(xmlDoc).find('locations > GameLocation > Characters > NPC').each(function () {
			if ($(this).attr(saveInfo.ns_prefix + ':type') === 'Cat' || $(this).attr(saveInfo.ns_prefix + ':type') === 'Dog') {
				hasPet = 1;
				petLove = Number($(this).find('friendshipTowardFarmer').text());
			}
		});
		if (petLove >= 999) {
			count++;
		}
		if (count >= 12) {
			candles = 4;
		} else if (count >= 8) {
			candles = 3;
		} else if (count >= 4) {
			candles = 2;
		}
		output = getSectionHeader(saveInfo, title, anchor, true, version);
		output += '<div class="' + anchor + '_summary ' + sum_class + '">';
		output += '<span class="result">' + farmer + ' 目前在爷爷的评价中获得了 ' + count +
				' 分 (详情在下面); 最多能获得 ' + max_count + ' 分</span><br />\n';
		output += '<span class="result">神龛已经点亮了 ' + currentCandles + ' 根蜡烛，下次评价将点亮 ' +
				candles + ' 根蜡烛</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (candles >= max_candles) ? getMilestoneString('点亮神龛的四根蜡烛', 1) :
				getMilestoneString('点亮神龛的四根蜡烛', 0) + (12 - count) + ' 分';
		output += '</li></ul></span>';

		output += '<div class="' + anchor + '_details ' + det_class + '">';
		output += '<span class="result">' + farmer + ' 总收入为 ' + addCommas(money) + 'g</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (money >= 5e4) ? getPointString(1, '总收入达到 50,000g', 0, 1) :
				getPointString(1, '总收入达到 50,000g', 0, 0) + ' -- 需要再挣 ' + addCommas(5e4 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 1e5) ? getPointString(1, '总收入达到 100,000g', 1, 1) :
				getPointString(1, '总收入达到 100,000g', 1, 0) + ' -- 需要再挣 ' + addCommas(1e5 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 2e5) ? getPointString(1, '总收入达到 200,000g', 1, 1) :
				getPointString(1, '总收入达到 200,000g', 1, 0) + ' -- 需要再挣 ' + addCommas(2e5 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 3e5) ? getPointString(1, '总收入达到 300,000g', 1, 1) :
				getPointString(1, '总收入达到 300,000g', 1, 0) + ' -- 需要再挣 ' + addCommas(3e5 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 5e5) ? getPointString(1, '总收入达到 500,000g', 1, 1) :
				getPointString(1, '总收入达到 500,000g', 1, 0) + ' -- 需要再挣 ' + addCommas(5e5 - money) + 'g';
		output += '</li>\n<li>';
		output += (money >= 1e6) ? getPointString(2, '总收入达到 1,000,000g', 1, 1) :
				getPointString(2, '总收入达到 1,000,000g', 1, 0) + ' -- 需要再挣 ' + addCommas(1e6 - money) + 'g';
		output += '</li></ul>\n';

		output += '<span class="result">' + farmer + ' 已获得 ' + Object.keys(ach_have).length +
				' 个相关成就，总共有 ' + ach_count + ' 个</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (ach_have.hasOwnProperty(5)) ? getPointString(1, '<span class="ach">全套收集</span> Achievement', 0, 1) :
				getPointString(1, '<span class="ach">全套收集</span> 成就', 0, 0);
		output += '</li>\n<li>';
		output += (ach_have.hasOwnProperty(26)) ? getPointString(1, '<span class="ach">垂钓大师</span> Achievement', 0, 1) :
				getPointString(1, '<span class="ach">垂钓大师</span> 成就', 0, 0);
		output += '</li>\n<li>';
		output += (ach_have.hasOwnProperty(34)) ? getPointString(1, '<span class="ach">全部货物</span> Achievement', 0, 1) :
				getPointString(1, '<span class="ach">全部货物</span> 成就', 0, 0);
		output += '</li></ul>\n';

		if (isJojaMember) {
			output += '<span class="result">' + farmer + ' 已是Joja会员，无法完成社区中心的重建';
			output += '<ul class="ach_list"><li>';
			output += getPointImpossibleString(1, '完成所有社区中心的收集包');
			output += '</li>\n<li>';
			output += getPointImpossibleString(2, '参加社区中心的竣工仪式');
			output += '</li></ul>\n';
		} else {
			if (cc_done || cc_have >= cc_count) {
				output += '<span class="result">' + farmer + ' 已经完成了所有社区中心的收集包';
				output += (cc_done) ? ' ，参加社区中心的竣工仪式' : ' ，但还没有参加社区中心的竣工仪式';
				output += '</span><br />\n';
			} else {
				output += '<span class="result">' + farmer + ' 还没有完成所有社区中心的收集包';
			}
			output += '<ul class="ach_list"><li>';
			output += (cc_done || cc_have >= cc_count) ? getPointString(1, '完成所有社区中心的收集包', 0, 1) :
					getPointString(1, '完成所有社区中心的收集包', 0, 0);
			output += '</li>\n<li>';
			output += (cc_done) ? getPointString(2, '参加社区中心的竣工仪式', 0, 1) :
					getPointString(2, '参加社区中心的竣工仪式', 0, 0);
			output += '</li></ul>\n';
		}

		output += '<span class="result">' + farmer + ' 所有技能等级和为 ' + realPlayerLevel + ' 级</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (playerLevel >= 15) ? getPointString(1, '所有技能等级和达到 30', 0, 1) :
				getPointString(1, '所有技能等级和达到 30', 0, 0) + ' -- 还需要 ' + (30 - realPlayerLevel) + ' 级';
		output += '</li>\n<li>';
		output += (playerLevel >= 25) ? getPointString(1, '所有技能等级和达到 50', 1, 1) :
				getPointString(1, '所有技能等级和达到 50', 1, 0) + ' -- 还需要 ' + (50 - realPlayerLevel) + ' 级';
		output += '</li></ul>\n';

		output += '<span class="result">' + farmer + ' 与 ' + heart_count +
				' 个村民达到了 1975+ 友谊值 (8&#x2665;)</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (heart_count >= 5) ? getPointString(1, '与 5 个村民达到 8&#x2665; 好感度', 0, 1) :
				getPointString(1, '与 5 个村民达到 8&#x2665; 好感度', 0, 0) + ' -- 还需要 ' + (5 - heart_count) + ' 人';
		output += '</li>\n<li>';
		output += (heart_count >= 10) ? getPointString(1, '与 10 个村民达到 8&#x2665; 好感度', 1, 1) :
				getPointString(1, '与 10 个村民达到 8&#x2665; 好感度', 1, 0) + ' -- 还需要 ' + (10 - heart_count) + ' 人';
		output += '</li></ul>\n';

		if (hasPet) {
			output += '<span class="result">' + farmer + ' 领养了一个宠物，和其好感度为 ' + petLove + '</span><br />\n';
		} else {
			need = ' 领养一个宠物 ';
			output += '<span class="result">' + farmer + ' 没有领养宠物</span><br />\n';
		}
		output += '<ul class="ach_list"><li>';
		output += (petLove >= 999) ? getPointString(1, '与宠物达到至少 999 好感值', 0, 1) :
				getPointString(1, '与宠物达到至少 999 好感值', 0, 0) + ' -- 还需要' +
				need + '与宠物达到 ' + (999 - petLove) + ' 好感值';
		output += '</li></ul>\n';

		output += '<span class="result">' + farmer + ((spouse.length > 0) ? ' 已经结婚了' : ' 还没有结婚') +
				' 且已经升级住所 ' + houseUpgrades + ' 次</span><br />\n';
		output += '<ul class="ach_list"><li>';
		need = [];
		if (spouse.length === 0) {
			need.push('结婚');
		}
		if (houseUpgrades < 2) {
			need.push('升级住所 ' + (2 - houseUpgrades) + ' 次');
		}
		output += (need.length === 0) ? getPointString(1, '已婚且房子至少升级 2 次', 0, 1) :
				getPointString(1, '已婚且房子至少升级 2 次', 0, 0) + ' -- 还需要 ' + need.join(" 且 ");
		output += '</li></ul>\n';

		if (hasKeys.length > 0) {
			output += '<span class="result">' + farmer + ' 已经有了 ' + hasKeys.join(" 和 ") + '</span><br />\n';
		} else {
			output += '<span class="result">' + farmer + ' 没有头骨钥匙和生锈的钥匙</span><br />\n';
		}
		output += '<ul class="ach_list"><li>';
		output += (hasRustyKey === 'true') ? getPointString(1, '获得生锈的钥匙', 0, 1) :
				getPointString(1, '获得生锈的钥匙', 0, 0) + ' -- 在博物馆捐献 60 个物品后获得';
		output += '</li>\n<li>';
		output += (hasSkullKey === 'true') ? getPointString(1, '获得头骨钥匙', 0, 1) :
				getPointString(1, '获得头骨钥匙', 0, 0) + ' -- 在到达矿井 120 层后获得';
		output += '</li></ul></div>';
		output += getSectionFooter();
		
		return output;
	}

	function parseBundlesOld(xmlDoc, saveInfo) {
		// TODO - boy howdy is 1.5 different
		// Bundle info from Data\Bundles.xnb & StardewValley.Locations.CommunityCenter class
		var title = 'Community Center / Joja Community Development',
			anchor = makeAnchor(title),
			version = "1.2",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			farmer = $(xmlDoc).find('player > name').html(),
			hasDetails = false,
			isJojaMember = 0,
			room = {
				0: {
					'name': 'Pantry',
					'bundles': {
						0: 'Spring Crops',
						1: 'Summer Crops',
						2: 'Fall Crops',
						3: 'Quality Crops',
						4: 'Animal',
						5: 'Artisan'
					}
				},
				1: {
					'name': 'Crafts Room',
					'bundles': {
						13: 'Spring Foraging',
						14: 'Summer Foraging',
						15: 'Fall Foraging',
						16: 'Winter Foraging',
						17: 'Construction',
						19: 'Exotic Foraging'
					}
				},
				2: {
					'name': 'Fish Tank',
					'bundles': {
						6: 'River Fish',
						7: 'Lake Fish',
						8: 'Ocean Fish',
						9: 'Night Fishing',
						10: 'Specialty Fish',
						11: 'Crab Pot'
					}
				},
				3: {
					'name': 'Boiler Room',
					'bundles': {
						20: "Blacksmith's",
						21: "Geologist's",
						22: "Adventurer's"
					}
				},
				4: {
					'name': 'Vault',
					'bundles': {
						23: ' 2,500g',
						24: ' 5,000g',
						25: '10,000g',
						26: '25,000g'
					}
				},
				5: {
					'name': 'Bulletin Board',
					'bundles': {
						31: "Chef's",
						32: 'Field Research',
						33: "Enchanter's",
						34: 'Dye',
						35: 'Fodder'
					}
				}
			},
			bundleHave = {},
			bundleCount = { // number of items in each bundle
				0: 4,
				1: 4,
				2: 4,
				3: 3,
				4: 5,
				5: 6,
				6: 4,
				7: 4,
				8: 4,
				9: 3,
				10: 4,
				11: 5,
				13: 4,
				14: 3,
				15: 4,
				16: 4,
				17: 4,
				19: 5,
				20: 3,
				21: 4,
				22: 2,
				23: 1,
				24: 1,
				25: 1,
				26: 1,
				31: 6,
				32: 4,
				33: 4,
				34: 6,
				35: 3
			},
			ccMail = {
				'ccBoilerRoom': 3,
				'ccCraftsRoom': 1,
				'ccPantry': 0,
				'ccFishTank': 2,
				'ccVault': 4,
				'ccBulletin': 5
			},
			ccCount = 6,
			ccHave = 0,
			ccEvent = '191393',
			project = ['Greenhouse', 'Bridge', 'Panning', 'Minecarts', 'Bus'],
			price = ['35,000g', '25,000g', '20,000g', '15,000g', '40,000g'],
			jojaMail = {
				'jojaBoilerRoom': 3,
				'jojaCraftsRoom': 1,
				'jojaPantry': 0,
				'jojaFishTank': 2,
				'jojaVault': 4
			},
			jojaCount = 5,
			jojaHave = 0,
			jojaEvent = '502261',
			eventToCheck = '',
			hasSeenCeremony = 0,
			done = {},
			hybrid = 0,
			hybridLeft = 0,
			id,
			r,
			b,
			temp,
			bundleNeed = [],
			need = [],
			ccLoc = $(xmlDoc).find("locations > GameLocation[" + saveInfo.ns_prefix + "\\:type='CommunityCenter']");

		// First check basic completion
		r = 0;
		$(ccLoc).find('areasComplete > boolean').each(function () {
			if ($(this).text() === 'true') {
				ccHave++;
				done[r] = 1;
			}
			r++;
		});
		// Now look at bundles. Getting an item count but not which items are placed
		$(ccLoc).find('bundles > item').each(function () {
			id = $(this).find('key > int').text();
			bundleHave[id] = 0;
			$(this).find('ArrayOfBoolean > boolean').each(function () {
				if ($(this).text() === 'true') {
					bundleHave[id]++;
				}
			});
		});
		$(xmlDoc).find('player > mailReceived > string').each(function () {
			var id = $(this).text();
			if (id === 'JojaMember') {
				isJojaMember = 1;
			} else if (jojaMail.hasOwnProperty(id)) {
				jojaHave++;
				done[jojaMail[id]] = 1;
			}
		});
		if (ccHave > 0 && isJojaMember) {
			hybrid = 1;
		}
		hybridLeft = jojaCount - ccHave;
		if (done.hasOwnProperty(ccMail.ccBulletin)) {
			hybridLeft++;
		}
		eventToCheck = (isJojaMember) ? jojaEvent : ccEvent;
		$(xmlDoc).find('player > eventsSeen > int').each(function () {
			if ($(this).text() === eventToCheck) {
				hasSeenCeremony = 1;
			}
		});
		
		output += '<div class="' + anchor + '_summary ' + sum_class + '">';
		// New information from Gigafreak#4754 on Discord confirms that the Joja achieve does trigger even if
		// most of the CC was completed through bundles. So warnings are removed and Joja will not be marked
		// impossible unless the CC is actually done.
		if (isJojaMember) {
			if (hybrid) {
				output += '<span class="result">' + farmer + ' 完成了 ' + ccHave +
					' 个社区中心的收集包，之后加入了Joja会员</span><br />\n';
				output += '<span class="result">' + farmer + ' 完成了 ' + jojaHave + ' 个Joja社区发展申请书项目，总共有 ' +
					hybridLeft + ' 个</span><br />\n';
			} else {
				output += '<span class="result">' + farmer + ' 加入了Joja会员，完成了 ' + jojaHave +
					' 个Joja社区发展申请书项目，总共有 ' + jojaCount + ' 个</span><br />\n';
			}
			hybridLeft -= jojaHave;
			output += '<span class="result">' + farmer + ((hasSeenCeremony) ? ' 参加了' : ' 还没有参加') +
					' 完成典礼</span><br />\n<ul class="ach_list"><li>';
			output += getAchieveImpossibleString('当地传奇', '修复星露谷的社区中心');
			output += '</li><li>\n';
			if (!hasSeenCeremony) {
				if (hybridLeft > 0) {
					temp = hybridLeft + ' 个项目以及参加完成典礼';
					// Since we are supporting hybrid playthrough, we check the CC versions of mail, not joja
					for (id in ccMail) {
						if (ccMail.hasOwnProperty(id) && id !== "ccBulletin") {
							if (!done.hasOwnProperty(ccMail[id])) {
								need.push('<li> 购买 ' + project[ccMail[id]] + ' 项目，价格为 ' + price[ccMail[id]] + '</li>');
							}
						}
					}
				} else {
					temp = ' 参加完成典礼';
				}
				need.push('<li>参加在Joja仓库前举行的完成典礼</li>');
			}
			output += (hasSeenCeremony) ? getAchieveString('Joja公司年度会员', '成为Joja公司的会员并购买所有社区发展福利', 1) :
					getAchieveString('Joja公司年度会员', '成为Joja公司的会员并购买所有社区发展福利', 0) + temp;
			output += '</li></ul>\n';
		} else {
			output += '<span class="result">' + farmer + ' 不是Joja会员，完成了 ' + ccHave +
					' 个社区中心收集包，总共有 ' + ccCount + ' 个</span><br />\n';
			output += '<span class="result">' + farmer + ((hasSeenCeremony) ? ' 参加了' : ' 还没有参加') +
					' 完成典礼</span><br />\n<ul class="ach_list"><li>';
			if (ccHave === 0) {
				output += getAchieveString('Joja公司年度会员', '成为Joja公司的会员并购买所有社区发展福利', 0) + '加入Joja会员，购买所有的社区发展福利';
			} else if (ccHave < ccCount) {
				output += getAchieveString('Joja公司年度会员', '成为Joja公司的会员并购买所有社区发展福利', 0) + '加入Joja会员，购买所有的社区发展福利 (剩余 ' + hybridLeft + " 个)";
			} else {
				output += getAchieveImpossibleString('Joja公司年度会员', '成为Joja公司的会员并购买所有社区发展福利');
			}
			output += '</li><li>\n';
			if (!hasSeenCeremony) {
				if (ccHave < ccCount) {
					temp = (ccCount - ccHave) + ' 个收集包及参加完成典礼';
					for (id in ccMail) {
						if (ccMail.hasOwnProperty(id)) {
							r = ccMail[id];
							if (!done.hasOwnProperty(r)) {
								bundleNeed = [];
								if (room.hasOwnProperty(r)) {
									for (b in room[r].bundles) {
										if (room[r].bundles.hasOwnProperty(b)) {
											if (bundleHave[b] < bundleCount[b]) {
												bundleNeed.push('<li>' + translateWord(room[r].bundles[b], "bundle") + '收集包 -- 还需要 ' +
													(bundleCount[b] - bundleHave[b]) + ' 项物品</li>');
											}
										}
									}
								}
								need.push('<li> ' + wikify(room[r].name, 'Bundles', undefined, 'bundle') + '<ol>' + bundleNeed.sort().join('') + '</ol></li>');
							}
						}
					}
				} else {
					temp = ' 参加完成典礼';
				}
				need.push('<li>参加社区中心的重建典礼</li>');
			}
			output += (ccHave >= ccCount && hasSeenCeremony) ? getAchieveString('当地传奇', '修复星露谷的社区中心', 1) :
					getAchieveString('当地传奇', '修复星露谷的社区中心', '', 0) + temp;
			output += '</li></ul></div>';
		}
		if (need.length > 0) {
			hasDetails = true;
			output += '<div class="' + anchor + '_details ' + det_class + '">';
			output += '<span class="result warn">注: 目前不支持1.5版本的随机收集包，结果可能不准确<br /></span>';
			output += '<span class="need">还需要完成:<ol>' + need.sort().join('') + '</ol></span></div>';
		}

		output = getSectionHeader(saveInfo, title, anchor, hasDetails, version) + output + getSectionFooter();
		return output;
	}

	function parseBundles(xmlDoc, saveInfo) {
		// This was substantially rewritten for Stardew 1.5 since that version's Random Bundles option caused
		//  the full bundle information to be placed in the save. Since we are going to at least have to partly
		//  parse the bundle definitions now, we might as well hardcode the default bundles and handle older
		//  versions that way.
		var title = 'Community Center / Joja Community Development',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			farmer = $(xmlDoc).find('player > name').html(),
			hasDetails = false,
			isJojaMember = 0,
			room = {},
			bundleHave = {},
			bundleCount = {},
			ccMail = {
				'ccBoilerRoom': 3,
				'ccCraftsRoom': 1,
				'ccPantry': 0,
				'ccFishTank': 2,
				'ccVault': 4,
				'ccBulletin': 5
			},
			ccCount = 6,
			ccHave = 0,
			ccEvent = '191393',
			project = ['Greenhouse', 'Bridge', 'Panning', 'Minecarts', 'Bus'],
			price = ['35,000g', '25,000g', '20,000g', '15,000g', '40,000g'],
			jojaMail = {
				'jojaBoilerRoom': 3,
				'jojaCraftsRoom': 1,
				'jojaPantry': 0,
				'jojaFishTank': 2,
				'jojaVault': 4
			},
			jojaCount = 5,
			jojaHave = 0,
			jojaEvent = '502261',
			eventToCheck = '',
			hasSeenCeremony = 0,
			done = {},
			hybrid = 0,
			hybridLeft = 0,
			id,
			r,
			b,
			temp,
			bundleNeed = [],
			need = [],
			ccLoc = $(xmlDoc).find("locations > GameLocation[" + saveInfo.ns_prefix + "\\:type='CommunityCenter']"),
			defaultData = {
				"Pantry/0": "Spring Crops/O 465 20/24 1 0 188 1 0 190 1 0 192 1 0/0",
				"Pantry/1": "Summer Crops/O 621 1/256 1 0 260 1 0 258 1 0 254 1 0/3",
				"Pantry/2": "Fall Crops/BO 10 1/270 1 0 272 1 0 276 1 0 280 1 0/2",
				"Pantry/3": "Quality Crops/BO 15 1/24 5 2 254 5 2 276 5 2 270 5 2/6/3",
				"Pantry/4": "Animal/BO 16 1/186 1 0 182 1 0 174 1 0 438 1 0 440 1 0 442 1 0 639 1 0 640 1 0 641 1 0 642 1 0 643 1 0/4/5",
				"Pantry/5": "Artisan/BO 12 1/432 1 0 428 1 0 426 1 0 424 1 0 340 1 0 344 1 0 613 1 0 634 1 0 635 1 0 636 1 0 637 1 0 638 1 0/1/6",
				"Crafts Room/13": "Spring Foraging/O 495 30/16 1 0 18 1 0 20 1 0 22 1 0/0",
				"Crafts Room/14": "Summer Foraging/O 496 30/396 1 0 398 1 0 402 1 0/3",
				"Crafts Room/15": "Fall Foraging/O 497 30/404 1 0 406 1 0 408 1 0 410 1 0/2",
				"Crafts Room/16": "Winter Foraging/O 498 30/412 1 0 414 1 0 416 1 0 418 1 0/6",
				"Crafts Room/17": "Construction/BO 114 1/388 99 0 388 99 0 390 99 0 709 10 0/4",
				"Crafts Room/19": "Exotic Foraging/O 235 5/88 1 0 90 1 0 78 1 0 420 1 0 422 1 0 724 1 0 725 1 0 726 1 0 257 1 0/1/5",
				"Fish Tank/6": "River Fish/O 685 30/145 1 0 143 1 0 706 1 0 699 1 0/6",
				"Fish Tank/7": "Lake Fish/O 687 1/136 1 0 142 1 0 700 1 0 698 1 0/0",
				"Fish Tank/8": "Ocean Fish/O 690 5/131 1 0 130 1 0 150 1 0 701 1 0/5",
				"Fish Tank/9": "Night Fishing/R 516 1/140 1 0 132 1 0 148 1 0/1",
				"Fish Tank/10": "Specialty Fish/O 242 5/128 1 0 156 1 0 164 1 0 734 1 0/4",
				"Fish Tank/11": "Crab Pot/O 710 3/715 1 0 716 1 0 717 1 0 718 1 0 719 1 0 720 1 0 721 1 0 722 1 0 723 1 0 372 1 0/1/5",
				"Boiler Room/20": "Blacksmith's/BO 13 1/334 1 0 335 1 0 336 1 0/2",
				"Boiler Room/21": "Geologist's/O 749 5/80 1 0 86 1 0 84 1 0 82 1 0/1",
				"Boiler Room/22": "Adventurer's/R 518 1/766 99 0 767 10 0 768 1 0 769 1 0/1/2",
				"Vault/23": "2,500g/O 220 3/-1 2500 2500/4",
				"Vault/24": "5,000g/O 369 30/-1 5000 5000/2",
				"Vault/25": "10,000g/BO 9 1/-1 10000 10000/3",
				"Vault/26": "25,000g/BO 21 1/-1 25000 25000/1",
				"Bulletin Board/31": "Chef's/O 221 3/724 1 0 259 1 0 430 1 0 376 1 0 228 1 0 194 1 0/4",
				"Bulletin Board/32": "Field Research/BO 20 1/422 1 0 392 1 0 702 1 0 536 1 0/5",
				"Bulletin Board/33": "Enchanter's/O 336 5/725 1 0 348 1 0 446 1 0 637 1 0/1",
				"Bulletin Board/34": "Dye/BO 25 1/420 1 0 397 1 0 421 1 0 444 1 0 62 1 0 266 1 0/6",
				"Bulletin Board/35": "Fodder/BO 104 1/262 10 0 178 10 0 613 3 0/3",
				"Abandoned Joja Mart/36": "The Missing//348 1 1 807 1 0 74 1 0 454 5 2 795 1 2 445 1 0/1/5"
			};

		if (compareSemVer(saveInfo.version, version) < 0) {
			return parseBundlesOld(xmlDoc, saveInfo);
		} else {
			return parseBundlesOld(xmlDoc, saveInfo);
		}
		
/*		
		// TODO - boy howdy is 1.5 different
		// Bundle info from Data\Bundles.xnb & StardewValley.Locations.CommunityCenter class
			room = {
				0: {
					'name': 'Pantry',
					'bundles': {
						0: 'Spring Crops',
						1: 'Summer Crops',
						2: 'Fall Crops',
						3: 'Quality Crops',
						4: 'Animal',
						5: 'Artisan'
					}
				},
				1: {
					'name': 'Crafts Room',
					'bundles': {
						13: 'Spring Foraging',
						14: 'Summer Foraging',
						15: 'Fall Foraging',
						16: 'Winter Foraging',
						17: 'Construction',
						19: 'Exotic Foraging'
					}
				},
				2: {
					'name': 'Fish Tank',
					'bundles': {
						6: 'River Fish',
						7: 'Lake Fish',
						8: 'Ocean Fish',
						9: 'Night Fishing',
						10: 'Specialty Fish',
						11: 'Crab Pot'
					}
				},
				3: {
					'name': 'Boiler Room',
					'bundles': {
						20: "Blacksmith's",
						21: "Geologist's",
						22: "Adventurer's"
					}
				},
				4: {
					'name': 'Vault',
					'bundles': {
						23: ' 2,500g',
						24: ' 5,000g',
						25: '10,000g',
						26: '25,000g'
					}
				},
				5: {
					'name': 'Bulletin Board',
					'bundles': {
						31: "Chef's",
						32: 'Field Research',
						33: "Enchanter's",
						34: 'Dye',
						35: 'Fodder'
					}
				}
			},
			bundleCount = { // number of items in each bundle
				0: 4,
				1: 4,
				2: 4,
				3: 3,
				4: 5,
				5: 6,
				6: 4,
				7: 4,
				8: 4,
				9: 3,
				10: 4,
				11: 5,
				13: 4,
				14: 3,
				15: 4,
				16: 4,
				17: 4,
				19: 5,
				20: 3,
				21: 4,
				22: 2,
				23: 1,
				24: 1,
				25: 1,
				26: 1,
				31: 6,
				32: 4,
				33: 4,
				34: 6,
				35: 3
			},
*/
		// First check basic completion
		r = 0;
		$(ccLoc).find('areasComplete > boolean').each(function () {
			if ($(this).text() === 'true') {
				ccHave++;
				done[r] = 1;
			}
			r++;
		});
		// Now look at bundles. Getting an item count but not which items are placed
		$(ccLoc).find('bundles > item').each(function () {
			id = $(this).find('key > int').text();
			bundleHave[id] = 0;
			$(this).find('ArrayOfBoolean > boolean').each(function () {
				if ($(this).text() === 'true') {
					bundleHave[id]++;
				}
			});
		});
		$(xmlDoc).find('player > mailReceived > string').each(function () {
			var id = $(this).text();
			if (id === 'JojaMember') {
				isJojaMember = 1;
			} else if (jojaMail.hasOwnProperty(id)) {
				jojaHave++;
				done[jojaMail[id]] = 1;
			}
		});
		if (ccHave > 0 && isJojaMember) {
			hybrid = 1;
		}
		hybridLeft = jojaCount - ccHave;
		if (done.hasOwnProperty(ccMail.ccBulletin)) {
			hybridLeft++;
		}
		eventToCheck = (isJojaMember) ? jojaEvent : ccEvent;
		$(xmlDoc).find('player > eventsSeen > int').each(function () {
			if ($(this).text() === eventToCheck) {
				hasSeenCeremony = 1;
			}
		});
		
		output += '<div class="' + anchor + '_summary ' + sum_class + '">';
		// New information from Gigafreak#4754 on Discord confirms that the Joja achieve does trigger even if
		// most of the CC was completed through bundles. So warnings are removed and Joja will not be marked
		// impossible unless the CC is actually done.
		if (isJojaMember) {
			if (hybrid) {
				output += '<span class="result">' + farmer + ' completed ' + ccHave +
					' Community Center room(s) and then became a Joja member.</span><br />\n';
				output += '<span class="result">' + farmer + ' has since completed ' + jojaHave + ' of the remaining ' +
					hybridLeft + ' projects on the Community Development Form.</span><br />\n';
			} else {
				output += '<span class="result">' + farmer + ' is a Joja member and has completed ' + jojaHave +
					' of the ' + jojaCount + ' projects on the Community Development Form.</span><br />\n';
			}
			hybridLeft -= jojaHave;
			output += '<span class="result">' + farmer + ((hasSeenCeremony) ? ' has' : ' has not') +
					' attended the completion ceremony</span><br />\n<ul class="ach_list"><li>';
			output += getAchieveImpossibleString('Local Legend', 'restore the Pelican Town Community Center');
			output += '</li><li>\n';
			if (!hasSeenCeremony) {
				if (hybridLeft > 0) {
					temp = hybridLeft + ' more project(s) and the ceremony';
					// Since we are supporting hybrid playthrough, we check the CC versions of mail, not joja
					for (id in ccMail) {
						if (ccMail.hasOwnProperty(id) && id !== "ccBulletin") {
							if (!done.hasOwnProperty(ccMail[id])) {
								need.push('<li> Purchase ' + project[ccMail[id]] + ' project for ' + price[ccMail[id]] + '</li>');
							}
						}
					}
				} else {
					temp = ' to attend the ceremony';
				}
				need.push('<li>Attend the completion ceremony at the Joja Warehouse</li>');
			}
			output += (hasSeenCeremony) ? getAchieveString('Joja Co. Member Of The Year', '', 1) :
					getAchieveString('Joja Co. Member Of The Year', '', 0) + temp;
			output += '</li></ul>\n';
		} else {
			output += '<span class="result">' + farmer + ' is not a Joja member and has completed ' + ccHave +
					' of the ' + ccCount + ' Community Center rooms.</span><br />\n';
			output += '<span class="result">' + farmer + ((hasSeenCeremony) ? ' has' : ' has not') +
					' attended the completion ceremony</span><br />\n<ul class="ach_list"><li>';
			if (ccHave === 0) {
				output += getAchieveString('Joja Co. Member Of The Year', '', 0) + 'to become a Joja member and purchase all community development perks';
			} else if (ccHave < ccCount) {
				output += getAchieveString('Joja Co. Member Of The Year', '', 0) + 'to become a Joja member and purchase any remaining community development perks (' + hybridLeft + " left)";
			} else {
				output += getAchieveImpossibleString('Joja Co. Member Of The Year', 'become a Joja member and purchase all community development perks');
			}
			output += '</li><li>\n';
			if (!hasSeenCeremony) {
				if (ccHave < ccCount) {
					temp = (ccCount - ccHave) + ' more room(s) and the ceremony';
					for (id in ccMail) {
						if (ccMail.hasOwnProperty(id)) {
							r = ccMail[id];
							if (!done.hasOwnProperty(r)) {
								bundleNeed = [];
								if (room.hasOwnProperty(r)) {
									for (b in room[r].bundles) {
										if (room[r].bundles.hasOwnProperty(b)) {
											if (bundleHave[b] < bundleCount[b]) {
												bundleNeed.push('<li>' + room[r].bundles[b] + ' Bundle -- ' +
													(bundleCount[b] - bundleHave[b]) + ' more item(s)</li>');
											}
										}
									}
								}
								need.push('<li> ' + wikify(room[r].name, 'Bundles') + '<ol>' + bundleNeed.sort().join('') + '</ol></li>');
							}
						}
					}
				} else {
					temp = ' to attend the ceremony';
				}
				need.push('<li>Attend the re-opening ceremony at the Community Center</li>');
			}
			output += (ccHave >= ccCount && hasSeenCeremony) ? getAchieveString('Local Legend', '', 1) :
					getAchieveString('Local Legend', '', 0) + temp;
			output += '</li></ul></div>';
		}
		if (need.length > 0) {
			hasDetails = true;
			output += '<div class="' + anchor + '_details ' + det_class + '">';
			output += '<span class="need">Left to do:<ol>' + need.sort().join('') + '</ol></span></div>';
		}

		output = getSectionHeader(saveInfo, title, anchor, hasDetails, version) + output + getSectionFooter();
		return output;
	}

	function parseSecretNotes(xmlDoc, saveInfo) {
		var title = 'Secret Notes',
			anchor = makeAnchor(title),
			version = "1.3",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
			meta.hasStoneJunimo = false;
		
		if (compareSemVer(saveInfo.version, "1.3") < 0) {
			return '';
		}
		
		// Stone Junimo is a giant pain in the ass. It seems to not have any confirmation so we have to search
		// the entire save for it. Worse, the buried one may reappear later so we need to ignore that one when
		// searching. The buried one is at (57, 16) on the Town map.
		// It also should not be obtainable if the players went the Joja route, but we will deal with that later.
		$(xmlDoc).find('Item > name').each(function () {
			if ($(this).text() === "Stone Junimo") {
				// Found one in storage somewhere. We good.
				meta.hasStoneJunimo = true;
				return false;
			}
		});
		if (!meta.hasStoneJunimo) {
			$(xmlDoc).find('Object > name').each(function () {
				if ($(this).text() === "Stone Junimo") {
					var loc = $(this).parents('GameLocation').children('name').text();
					if (loc === 'Town') {
						var x = $(this).parents('item').find('key > Vector2 > X').text();
						var y = $(this).parents('item').find('key > Vector2 > Y').text();
						if (x !== '57' || y !== '16') {
							meta.hasStoneJunimo = true;
							return false;
						}
					} else {
						meta.hasStoneJunimo = true;
						return false;
					}
				}
			});
		}
		
		table[0] = parsePlayerSecretNotes($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerSecretNotes(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerSecretNotes(player, saveInfo, meta) {
		var output = '',
			table = [],
			farmer = $(player).children('name').html(),
			hasSeenKrobus = false,
			hasMagnifyingGlass = ($(player).children('hasMagnifyingGlass').text() === 'true'),
			isJojaMember = false,
			notes = {},
			need = [],
			rewards = {},
			reward_skip = {},
			found_notes = 0,
			found_rewards = 0,
			note_count = 23,
			reward_start = 13,
			reward_count = note_count - reward_start + 1,
			reward_re,
			i;

		if (compareSemVer(saveInfo.version, "1.4") >= 0) {
			note_count = 25;
			reward_count = 12;
			reward_skip[24] = true;
		}
		// Check Krobus event, then check for magnifier, then check number of notes
		// Also checking for one of the reward events here, so don't use "return false" to end early.
		$(player).find('eventsSeen > int').each(function () {
			if ($(this).text() === '520702') {
				hasSeenKrobus = true;
			} else if ($(this).text() === '2120303') {
				rewards[23] = true;
				found_rewards++;
			}
		});
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + (hasSeenKrobus ? '已经' : '还没有') + ' 看到公交站的黑影</span><br />\n';
		output += '<span class="result">' + farmer + (hasMagnifyingGlass ? '已经' : '还没有') + ' 找到放大镜</span><br />\n';
		$(player).find('secretNotesSeen > int').each(function () {
			// Filter out journal scraps
			if (Number($(this).text()) < 1000) {
				notes[$(this).text()] = true;
				found_notes++;
			}
		});
		output += '<span class="result">' + farmer + ' 已经读过 ' + found_notes + ' 张秘密纸条，总共有 ' +
			note_count + ' 张</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (found_notes >= note_count) ? getMilestoneString('阅读所有的秘密纸条', 1) :
				getMilestoneString('阅读所有的秘密纸条', 0) + (note_count - found_notes) + ' 张';
		output += '</li></ul></div>';
		if (found_notes < note_count) {
			for (i = 1; i <= note_count; i++) {
				if (!notes.hasOwnProperty(i)) {
					need.push('<li>' + wikify('Secret Note #' + i, 'Secret Notes', undefined, undefined) + '</li>');
				}
			}
			if (need.length > 0) {
				meta.hasDetails = true;
				output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
				output += '<span class="need">未被阅读的秘密纸条:<ol>' + need.join('') + '</ol></span></div>';
			}
		}
		table.push(output);
		// Most rewards are noted by SecretNoteXX_done mail items. The one for note 21 starts with lower-case s though.
		reward_re = new RegExp('[Ss]ecretNote(\\d+)_done');
		$(player).find('mailReceived > string').each(function () {
			var match = reward_re.exec($(this).text());
			if (match !== null) {
				rewards[match[1]] = true;
				found_rewards++;
			} else if ($(this).text() === 'gotPearl') {
				rewards[15] = true;
				found_rewards++;
			} else if ($(this).text() === 'junimoPlush') {
				rewards[13] = true;
				found_rewards++;
			} else if ($(this).text() === 'TH_Tunnel') {
				// Qi quest we just check for the start. Full completion is 'TH_Lumberpile'
				rewards[22] = true;
				found_rewards++;
			} else if ($(this).text() === 'carolinesNecklace') {
				rewards[25] = true;
				found_rewards++;
			} else if ($(this).text() === 'JojaMember') {
				isJojaMember = true;
			}
		});
		// Stone Junimo not available for Joja route. We silently remove it from the list, which isn't optimal
		if (isJojaMember) {
			reward_count--;
			reward_skip[14] = true;
		} else if (meta.hasStoneJunimo) {
			rewards[14] = true;
			found_rewards++;
		}

		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 找到了  ' + found_rewards + ' 张秘密纸条提示的宝藏，总共有 ' +
			reward_count + ' 张</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (found_rewards >= reward_count) ? getMilestoneString('找到所有秘密纸条提示的宝藏', 1) :
				getMilestoneString('找到所有秘密纸条提示的宝藏', 0) + (reward_count - found_rewards) + ' 张';
		output += '</li></ul></div>';
		if (found_rewards < reward_count) {
			need = [];
			for (i = reward_start; i <= note_count; i++) {
				if (!reward_skip.hasOwnProperty(i) && !rewards.hasOwnProperty(i)) {
					var extra = "";
					if (i == 14) {
						extra = " (注: 若物品被收集后破坏，则统计可能不准确)";
					}
					need.push('<li> 从 ' + wikify('Secret Note #' + i, 'Secret Notes', undefined, undefined) + ' 中得到提示' + extra + '</li>');
				}
			}
			if (need.length > 0) {
				meta.hasDetails = true;
				output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
				output += '<span class="need">未被找到的秘密纸条提示的宝藏:<ol>' + need.join('') + '</ol></span></div>';
			}
		}
		table.push(output);
		return table;
	}

	function parseJournalScraps(xmlDoc, saveInfo) {
		var title = 'Journal Scraps',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			table = [];
		
		if (compareSemVer(saveInfo.version, version) < 0) {
			return '';
		}
		
		table[0] = parsePlayerJournalScraps($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerJournalScraps(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}

	function parsePlayerJournalScraps(player, saveInfo, meta) {
		var output = '',
			table = [],
			farmer = $(player).children('name').html(),
			hasVisitedIsland = false,
			notes = {},
			need = [],
			rewards = { 1004: false, 1006: false, 1009: false, 1010: false },
			found_notes = 0,
			found_rewards = 0,
			note_count = 11,
			reward_count = 4,
			i;

		// Checking some reward completions here too
		$(player).find('mailReceived > string').each(function () {
			var mail = $(this).text();
			if (mail === 'Visited_Island') {
				hasVisitedIsland = true;
			} else if (mail === 'Island_W_BuriedTreasure2') {
				rewards[1006] = true;
				found_rewards++;
			} else if (mail === 'Island_W_BuriedTreasure') {
				rewards[1004] = true;
				found_rewards++;
			} else if (mail === 'Island_N_BuriedTreasure') {
				rewards[1010] = true;
				found_rewards++;
			}
		});
		
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + (hasVisitedIsland ? ' 已经' : ' 还没有') + ' 去过姜岛</span><br />\n';
		$(player).find('secretNotesSeen > int').each(function () {
			// Only count Journal Scraps
			if (Number($(this).text()) >= 1000) {
				notes[$(this).text()] = true;
				found_notes++;
			}
		});
		output += '<span class="result">' + farmer + ' 已经读过 ' + found_notes + ' 张日记残页，总共有 ' +
			note_count + ' 张</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (found_notes >= note_count) ? getMilestoneString('阅读所有的日记残页', 1) :
				getMilestoneString('阅读所有的日记残页', 0) + (note_count - found_notes) + ' 张';
		output += '</li></ul></div>';
		if (found_notes < note_count) {
			for (i = 1; i <= note_count; i++) {
				if (!notes.hasOwnProperty(1000 + Number(i))) {
					need.push('<li>' + wikify('Journal Scrap #' + i, 'Journal Scraps', undefined, undefined) + '</li>');
				}
			}
			if (need.length > 0) {
				meta.hasDetails = true;
				output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
				output += '<span class="need">还没读过的日记残页:<ol>' + need.join('') + '</ol></span></div>';
			}
		}
		table.push(output);
		// Most rewards are noted by mail flags already checked. For mermaid puzzle, we only check for walnut award.
		$(player).parents("SaveGame").first().find('collectedNutTracker > string').each(function () {
			if ($(this).text() === "Mermaid") {
				rewards[1009] = true;
				found_rewards++;
				return false;
			}
		});
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 找到了  ' + found_rewards + ' 个日记残页提示的宝藏，总共有 ' +
			reward_count + ' 个</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (found_rewards >= reward_count) ? getMilestoneString('找到所有日记残页提示的宝藏', 1) :
				getMilestoneString('找到所有日记残页提示的宝藏', 0) + (reward_count - found_rewards) + ' 个';
		output += '</li></ul></div>';
		if (found_rewards < reward_count) {
			need = [];
			var k = Object.keys(rewards).sort();
			for (i in k) {
				if (rewards.hasOwnProperty(k[i]) && !rewards[k[i]]) {
					var extra = " 中提示的宝藏";
					need.push('<li>' + wikify('Journal Scrap #' + (Number(k[i]) - 1000) , 'Journal Scraps', undefined, undefined) + extra + '</li>');
				}
			}
			if (need.length > 0) {
				meta.hasDetails = true;
				output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
				output += '<span class="need">未被找到的宝藏:<ol>' + need.join('') + '</ol></span></div>';
			}
		}
		table.push(output);
		return table;
	}

	function parseSpecialOrders(xmlDoc, saveInfo) {
		var title = 'Special Orders',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			found = {},
			found_count = 0,
			need = [],
			hasWalnutRoomAccess = false,
			town = { "Caroline": "Island Ingredients", "Clint": "Cave Patrol", "Demetrius": "Aquatic Overpopulation", "Demetrius2": "Biome Balance", "Emily": "Rock Rejuvenation", "Evelyn": "Gifts for George", "Gunther": "Fragments of the past", "Gus": "Gus' Famous Omelet", "Lewis": "Crop Order", "Linus": "Community Cleanup", "Pam": "The Strong Stuff", "Pierre": "Pierre's Prime Produce", "Robin": "Robin's Project", "Robin2": "Robin's Resource Rush", "Willy": "Juicy Bugs Wanted!", "Willy2": "Tropical Fish", "Wizard": "A Curious Substance", "Wizard2": "Prismatic Jelly" },
			town_count = Object.keys(town).length,
			qi = { "QiChallenge2": "Qi's Crop", "QiChallenge3": "Let's Play A Game", "QiChallenge4": "Four Precious Stones", "QiChallenge5": "Qi's Hungry Challenge", "QiChallenge6": "Qi's Cuisine", "QiChallenge7": "Qi's Kindness", "QiChallenge8": "Extended Family", "QiChallenge9": "Danger In The Deep", "QiChallenge10": "Skull Cavern Invasion", "QiChallenge12": "Qi's Prismatic Grange" },
			id;
		
		if (compareSemVer(saveInfo.version, version) < 0) {
			return '';
		}
		
		$(xmlDoc).find('completedSpecialOrders > string').each(function () {
			id = $(this).text();
			
			if (town.hasOwnProperty(id)) {
				found[id] = true;
				found_count++;
			}
		});

		var intro;
		if (saveInfo.numPlayers > 1) {
			intro = '居住在 ' + $(xmlDoc).find('player > farmName').html(); + ' 农场的居民已经';
		} else {
			intro = $(xmlDoc).find('player > name').html() + ' 已经';
		}
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + intro + ' 完成了 ' + found_count + ' 个特别任务，总共有 ' +
			town_count + ' 个</span><br />\n';
		output += '<ul class="ach_list"><li>';
		output += (found_count >= town_count) ? getMilestoneString('完成所有的特别任务', 1) :
				getMilestoneString('完成所有的特别任务', 0) + (town_count - found_count) + ' 个任务';
		output += '</li></ul></div>';
		if (found_count < town_count) {
			for (id in town) {
				if (!found.hasOwnProperty(id)) {
					need.push('<li>' + wikify(town[id], "任务#鹈鹕镇的特别任务列表", true, 'special order') + '</li>');
				}
			}
			if (need.length > 0) {
				meta.hasDetails = true;
				output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
				output += '<span class="need">未被完成过的任务:<ol>' + need.sort().join('') + '</ol></span></div>';
			}
		}

		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + output + getSectionFooter();
		return output;
	}

	function parseWalnuts(xmlDoc, saveInfo) {
		var title = 'Golden Walnuts',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			farmName = $(xmlDoc).find('player > farmName').html(),
			count = 0,
			found_count = 0,
			game_count = Number($(xmlDoc).find('goldenWalnutsFound').text()),
			found = {},
			need = {},
			id,
			umid = 'global', // No per-player parsing
			pt_pct = '',
			num,
			// Using same IDs as game uses internally
			trackerAllAtOnce = {
				// These are awarded all at once so the actual count is not listed in the save file
				// "Bush_IslandEast_17_37": { 'num':1, 'name':'Island Jungle Bush', 'hint':'In open center area (17,37)' },
                "Bush_IslandEast_17_37": { 'num':1, 'name':'岛屿东部：灌木丛', 'hint':'在前往雷欧家的丛林中' },
				"Bush_IslandShrine_23_34": { 'num':1, 'name':'岛屿东部：宝石鸟神龛附近灌木丛', 'hint':'在宝石鸟神龛南侧（下方）' },
				"Bush_IslandSouth_31_5": { 'num':1, 'name':'岛屿南部：灌木丛', 'hint':'Accessed from hidden path East of stairs on Island North map (31,5)' },
				"Bush_IslandNorth_9_84": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Hidden clearing in trees West of stairs from dock area (9,84)' },
				"Bush_IslandNorth_20_26": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Hidden clearing in trees on West side in front of Volcano (20,26)' },
				"Bush_IslandNorth_56_27": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Behind coconut tree on East side in front of Volcano (56,27)' },
				"Bush_IslandNorth_4_42": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Grassy area above Dig Site (4,42)' },
				"Bush_IslandNorth_45_38": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Grassy area above Field Office (45,38)' },
				"Bush_IslandNorth_47_40": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Grassy area above Field Office (47,40)' },
				"Bush_IslandNorth_13_33": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Along river accessed via secret passage from Volcano entrance (13,33)' },
				"Bush_IslandNorth_5_30": { 'num':1, 'name':'岛屿北部：灌木丛', 'hint':'Along river accessed via secret passage from Volcano entrance (5,39)' },
				
				"Bush_Caldera_28_36": { 'num':1, 'name':'岛屿北部：火山口灌木丛', 'hint':'Along Southern edge (28,36)' },
				"Bush_Caldera_9_34": { 'num':1, 'name':'岛屿北部：火山口灌木丛', 'hint':'Along Southern edge (9,34)' },
				"Bush_CaptainRoom_2_4": { 'num':1, 'name':'岛屿西部：沉船中灌木丛', 'hint':'Shipwreck is enterable from left side (2,4)' },

				"TreeNut": { 'num':1, 'name':'岛屿东部：雷欧家里的树', 'hint':'Hit the tree with an axe' },
				"Buried_IslandNorth_19_39": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'At top of stairs from Dig Site, marked by a circle of small rocks (19,39)' },
				"Buried_IslandNorth_19_13": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'Cliff edge West of Volcano, marked by a circle of small rocks (19,13)' },
				"Buried_IslandNorth_57_79": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'Sand patch within grass patch in SE corner, marked by a circle of small rocks (57,79)' },
				"Buried_IslandNorth_54_21": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'Along Eastern edge of Volcano, between rocks and plants (54,21)' },
				"Buried_IslandNorth_42_77": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'Dark grassy area just NE of stairs from dock, between tufts of long grass (42,77)' },
				"Buried_IslandNorth_62_54": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'NE corner of path between docks and Field Office, marked by slightly raised sand (62,54)' },
				"Buried_IslandNorth_26_81": { 'num':1, 'name':'岛屿北部：锄地', 'hint':'Beneath curved tree West of stairs from dock, marked by a circle of small rocks (26,81)' },
				"IslandLeftPlantRestored": { 'num':1, 'name':'岛屿北部：岛屿办事处——紫色花数量调查', 'hint':'答案是 22 朵' },
				"IslandRightPlantRestored": { 'num':1, 'name':'岛屿北部：岛屿办事处——海星数量调查', 'hint':'答案是 18 只' },
				"IslandBatRestored": { 'num':1, 'name':'岛屿北部：岛屿办事处——蝙蝠木乃伊捐赠', 'hint':'在火山地牢开采石头' },
				"IslandFrogRestored": { 'num':1, 'name':'岛屿北部：岛屿办事处——青蛙木乃伊捐赠', 'hint':'清除姜岛东部丛林内的杂草' },
				"IslandCenterSkeletonRestored": { 'num':6, 'name':'岛屿北部：岛屿办事处——巨大动物化石捐赠', 'hint':"腿骨化石 (需要 2 个) -- 开采姜岛挖掘场的骨头矿\n肋骨化石 -- 开采姜岛挖掘场的骨头矿或挖掘姜岛南部的远古斑点\n颅骨化石 -- 打开金色椰子\n脊柱化石 -- 挖掘姜岛南部沙滩的远古斑点或在姜岛挖掘场旁的小河钓鱼\n尾巴化石 -- 在姜岛挖掘场旁的小河淘金" },
				"IslandSnakeRestored": { 'num':3, 'name':'岛屿北部：岛屿办事处——蛇化石捐赠', 'hint':"蛇头骨 -- 挖掘姜岛挖掘场的远古斑点或挖掘姜岛西部的远古斑点或在姜岛西部钓鱼\n蛇脊椎骨 (需要 2 个) -- 挖掘姜岛西部的远古斑点" },
				"Bush_IslandWest_104_3": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'End of hidden path through dense trees in NE part of map (104,3)' },
				"Bush_IslandWest_31_24": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Behind Mahogany tree in Tiger Slime area (31,24)' },
				"Bush_IslandWest_38_56": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Behind palm tree near pond West of Birdie\'s hut (38,56)' },
				"Bush_IslandWest_75_29": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'In front of the trees above farmhouse (75,29)' },
				"Bush_IslandWest_64_30": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Elevated area on West side of river; follow path counter-clockwise from Tiger Slimes (64,30)' },
				"Bush_IslandWest_54_18": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Obscured by dense trees along path between Tiger Slimes and suspension bridge (54,18)' },
				"Bush_IslandWest_25_30": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Along wall SE of walnut door (25,30)' },
				"Bush_IslandWest_15_3": { 'num':1, 'name':'岛屿西部：灌木丛', 'hint':'Follow coastline N past walnut door (15,3)' },
				"Buried_IslandWest_21_81": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'In dark sand on SW coast, between circular indentations. (21,81)' },
				"Buried_IslandWest_62_76": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'Among debris pile S of farm, between blue starfish (62,76)' },
				"Buried_IslandWest_39_24": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'In Tiget Slime area, between tufts of long grass (39,24)' },
				"Buried_IslandWest_88_14": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'In grass in NE corner, between animated tiles (88,14)' },
				"Buried_IslandWest_43_74": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'Near tidal pools between blue and yellow starfish, initially blocked by boulder (43,74)' },
				"Buried_IslandWest_30_75": { 'num':1, 'name':'岛屿西部：锄地', 'hint':'Between tidal pools, marked by X (30,75)' },
				"IslandWestCavePuzzle": { 'num':3, 'name':'岛屿西部：五彩水晶谜题', 'hint':'位于老虎史莱姆小树林的东北侧洞穴内' },
				"SandDuggy": { 'num':1, 'name':'岛屿西部：打地鼠游戏', 'hint':'Can place items to block other holes' },
				"TreeNutShot": { 'num':1, 'name':'岛屿北部：棕榈树上', 'hint':'Can use slingshot to knock walnut from tree' },
				"Mermaid": { 'num':5, 'name':'岛屿南部：美人鱼谜题', 'hint':'Use flute blocks to play Mermaid\s song; stones provide tuning clues' },
				"Buried_IslandSouthEastCave_36_26": { 'num':1, 'name':'岛屿南部：海盗湾锄地', 'hint':'Among the barrels across from the dock (36,26)' },
				"Buried_IslandSouthEast_25_17": { 'num':1, 'name':'岛屿南部：锄地', 'hint':'NE of star pool, between yellow starfish (25,17)' },
				"StardropPool": { 'num':1, 'name':'岛屿南部：星型湖', 'hint':'Fish a walnut out of the pool' },
				"BananaShrine": { 'num':3, 'name':'岛屿东部：丛林中香蕉神龛', 'hint':'Place a banana on the shrine' },
				"IslandGourmand1": { 'num':5, 'name':'岛屿西部：青蛙美食家——任务 #1', 'hint':'种植甜瓜，成熟后与其对话（不要收获）' },
				"IslandGourmand2": { 'num':5, 'name':'岛屿西部：青蛙美食家——任务 #2', 'hint':'种植小麦，成熟后与其对话（不要收获）' },
				"IslandGourmand3": { 'num':5, 'name':'岛屿西部：青蛙美食家——任务 #3', 'hint':'种植大蒜，成熟后与其对话（不要收获）' },
				"IslandShrinePuzzle": { 'num':5, 'name':'岛屿东部：宝石鸟祭坛', 'hint':'Place gems dropped by the birds on appropriate pedestals' },
			},
			trackerExtra = {
				// Extra because it has unique handling via a special NetWorldState variable
				"GoldenCoconut": { 'num':1, 'name':'任何地方：打开金色椰子', 'hint':'' },
			},
			trackerLimited = {
				// These are (usually) awarded one at a time, sometimes with a random component.
				"Birdie": { 'num':5, 'name':'岛屿西部：完成任务 “海盗的妻子”', 'hint':'' },
				"Darts": { 'num':3, 'name':'岛屿东部：赢得海盗的小游戏', 'hint':'' },
				"TigerSlimeNut": { 'num':1, 'name':'岛屿西部：击杀老虎史莱姆', 'hint':'' },
				"VolcanoNormalChest": { 'num':1, 'name':'岛屿北部：火山地牢——打开普通宝箱', 'hint':'' },
				"VolcanoRareChest": { 'num':1, 'name':'岛屿北部：火山地牢——打开稀有宝箱', 'hint':'' },
				"VolcanoBarrel": { 'num':5, 'name':'岛屿北部：火山地牢——打破火山小工具', 'hint':'' },
				"VolcanoMining": { 'num':5, 'name':'岛屿北部：火山地牢——采矿', 'hint':'' },
				"VolcanoMonsterDrop": { 'num':5, 'name':'岛屿北部：火山地牢——击杀怪物', 'hint':'' },
				"IslandFarming": { 'num':5, 'name':'岛屿西部：收获作物', 'hint':'' },
				"MusselStone": { 'num':5, 'name':'岛屿西部：开采岛屿西部沙滩上的蚌矿', 'hint':'' },
				"IslandFishing": { 'num':5, 'name':'岛屿任何地方：钓鱼', 'hint':'' },
				"Island_N_BuriedTreasureNut": { 'num':1, 'name':'岛屿北部：日记残页 #10 提示的宝藏', 'hint':'只有在阅读日记残页后能获得，在火山入口西南方的棕榈树位置' },
				"Island_W_BuriedTreasureNut": { 'num':1, 'name':'岛屿西部：日记残页 #4 提示的宝藏', 'hint':'只有在阅读日记残页后能获得，在贝啼小屋北边' },
				"Island_W_BuriedTreasureNut2": { 'num':1, 'name':'岛屿西部：日记残页 #6 提示的宝藏', 'hint':'只有在阅读日记残页后能获得，农场南部沙滩的东南侧靠墙角落' },
			};

		if (compareSemVer(saveInfo.version, version) < 0) {
			return '';
		}
		
		// These are shared in multiplayer so do not need any parsePlayer subroutines
		var gcc = $(xmlDoc).find('SaveGame > goldenCoconutCracked').text();
		if (gcc === "true") {
			found["GoldenCoconut"] = 1;
			found_count++;
		}
		$(xmlDoc).find('collectedNutTracker > string').each(function () {
			id = $(this).text();
			
			if (trackerAllAtOnce.hasOwnProperty(id)) {
				found[id] = trackerAllAtOnce[id].num;
				found_count += trackerAllAtOnce[id].num;
			}
		});
		$(xmlDoc).find('limitedNutDrops > item').each(function () {
			id = $(this).find('key > string').text();
			num = Number($(this).find('value > int').text());
			if (trackerLimited.hasOwnProperty(id) && num > 0) {
				found[id] = num;
				found_count += num;
			}
		});
		
		for (id in trackerAllAtOnce) {
			if (trackerAllAtOnce.hasOwnProperty(id)) {
				count += trackerAllAtOnce[id].num;
				if (!found.hasOwnProperty(id)) {
					need[id] = trackerAllAtOnce[id].num;
				}
			}
		}
		for (id in trackerExtra) {
			if (trackerExtra.hasOwnProperty(id)) {
				count += trackerExtra[id].num;
				if (!found.hasOwnProperty(id)) {
					need[id] = trackerExtra[id].num;
				}
			}
		}
		for (id in trackerLimited) {
			if (trackerLimited.hasOwnProperty(id)) {
				count += trackerLimited[id].num;
				if (found.hasOwnProperty(id)) {
					if (found[id] < trackerLimited[id].num) {
						need[id] = trackerLimited[id].num - found[id];
					}
				} else {
					need[id] = trackerLimited[id].num;
				}
			}
		}
		
		// The game_count vs found_count discrepancy should only happen through mods or cheating, but we will account for it
		// Most goals will use goal_count except for the "collect all" milestone since we can still list unfound ones after.
		saveInfo.perfectionTracker[umid]["Walnuts"] = { 'count' : game_count, 'total' : count };
		if (compareSemVer(saveInfo.version, "1.5") >= 0) {
			var x = Math.min(100, 100 * game_count / count);
			var places = (x < 100) ? 1 : 0;
			x = x.toFixed(places);
			pt_pct = getPTLink(x + '%');
		}
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		var intro;
		if (saveInfo.numPlayers > 1) {
			intro = '住在 ' + $(xmlDoc).find('player > farmName').html(); + ' 农场的居民';
		} else {
			intro = $(xmlDoc).find('player > name').html();
		}
		output += '<span class="result">' + intro + ' 找到了 ' + game_count + ' 个金色核桃，总共有 ' +
			count + ' 个' + pt_pct + '</span>';
		if (found_count !== game_count) {
			output += '<br /><span class="result warn">注意: Save lists a count of ' + game_count + " but we've found markers for " + found_count + '</span>';
		}
		output += '<ul class="ach_list"><li>';
		output += (game_count >= 10) ? getMilestoneString('收集 10 个金色核桃，以获得雷欧的信任', 1) :
				getMilestoneString('收集 10 个金色核桃，以获得雷欧的信任', 0) + (10 - game_count) + ' 个';
		output += '</li>\n<li>';
		output += (game_count >= 101) ? getMilestoneString('收集 101 个金色核桃，以进入秘密房间', 1) :
				getMilestoneString('收集 101 个金色核桃，以进入秘密房间', 0) + (101 - game_count) + ' 个';
		output += '</li>\n<li>';
		output += (found_count >= count) ? getMilestoneString('收集所有的金色核桃', 1) :
				getMilestoneString('收集所有的金色核桃', 0) + (count - found_count) + ' 个';
		output += '</li></ul></div>';

		if (found_count < count) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未获取的金色核桃:<ol>';
			var val = 0;
			var keys = Object.keys(need);
			var forceShowSpoilers = false;
			for (var i in keys) {
				id = keys[i];
				val += need[id];
				output += '<li value="' + val + '">';
				var extra = "";
				if (need[id] > 1) {
					extra = " -- " + need[id] + " 个金色核桃";
				}
				
				if (trackerAllAtOnce.hasOwnProperty(id)) {
					output += trackerAllAtOnce[id].name + extra;
					if (trackerAllAtOnce[id].hint !== '') {
						if (forceShowSpoilers) {
							output += ' -- <span class="note">' + trackerAllAtOnce[id].hint + '</span>';
						} else {
							output += ' (<span class="note" data-tooltip="' + trackerAllAtOnce[id].hint + '">显示剧透</span>)';
						}
					}
					output += '</li>';
				} else if (trackerExtra.hasOwnProperty(id)) {
					output += trackerExtra[id].name + extra;
					if (trackerExtra[id].hint !== '') {
						if (forceShowSpoilers) {
							output += ' -- <span class="note">' + trackerExtra[id].hint + '</span>';
						} else {
							output += ' (<span class="note" data-tooltip="' + trackerExtra[id].hint + '">显示剧透</span>)';
						}
					}
					output += '</li>';
				} else if (trackerLimited.hasOwnProperty(id)) {
					output += trackerLimited[id].name + extra;
					if (trackerLimited[id].hint !== '') {
						if (forceShowSpoilers) {
							output += ' -- <span class="note">' + trackerLimited[id].hint + '</span>';
						} else {
							output += ' (<span class="note" data-tooltip="' + trackerLimited[id].hint + '">显示剧透</span>)';
						}
					}
					output += '</li>';
				} else {
					console.log("Walnut tracking found unknown id: " + id);
				}
			}
			output += '</ol></span></div>';
		}

		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + output + getSectionFooter();
		return output;
	}

	function parseIslandUpgrades(xmlDoc, saveInfo) {
		var title = 'Island Upgrades',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			farmName = $(xmlDoc).find('player > farmName').html(),
			count = 0,
			bought_count = 0,
			bought = {},
			need = {},
			id,
			cost = 0,
			upgrades = {
				"Island_FirstParrot": { 'cost': 1, 'name':'投喂雷欧的朋友：解锁姜岛北部通道' },
				"Island_Turtle": { 'cost': 10, 'name':'叫醒乌龟：解锁通往姜岛西部的通道' },
				"Island_UpgradeHouse": { 'cost': 20, 'name':'修好睡觉小屋：解锁姜岛西部农场的房屋，可在里面睡觉从而在岛上度过当日' },
				"Island_Resort": { 'cost': 20, 'name':'建个度假村：在港口附近建设度假村' },
				"Island_UpgradeTrader": { 'cost': 10, 'name':'建造贸易小屋：解锁姜岛商人的商店' },
				"Island_UpgradeBridge": { 'cost': 10, 'name':'修好桥：修复去挖掘场之桥梁。间接解锁岛屿办事处' },
				"Island_UpgradeParrotPlatform": { 'cost': 10, 'name':'鹦鹉特快：开启岛上传送系统鹦鹉特快' },
				"Island_UpgradeHouse_Mailbox": { 'cost': 5, 'name':'传递信件：可以在姜岛查看信件' },
				"Island_W_Obelisk": { 'cost': 20, 'name':'建个传送塔：建设将玩家传送回农场的建筑农场尖塔' },
				"Island_VolcanoBridge": { 'cost': 5, 'name':'建座桥：解锁通往火山内部的永久桥梁，使玩家不再需要浇水即可进入火山内部' },
				"Island_VolcanoShortcutOut": { 'cost': 5, 'name':'开条捷径：在火山地牢第5层挖一个出口到姜岛北部' },
			};

		if (compareSemVer(saveInfo.version, version) < 0) {
			return '';
		}
		count = Object.keys(upgrades).length;
		$(xmlDoc).find('player > mailReceived > string').each(function () {
			id = $(this).text();
			
			if (upgrades.hasOwnProperty(id)) {
				bought[id] = 1
				bought_count++;
			}
		});
		
		if (bought_count < count) {
			var keys = Object.keys(upgrades);
			for (var i = 0; i < count; i++) {
				if (!bought.hasOwnProperty(keys[i])) {
					need[keys[i]] = upgrades[keys[i]].cost;
					cost += upgrades[keys[i]].cost;
				}
			}
		}
		
		output += '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		var intro;
		if (saveInfo.numPlayers > 1) {
			intro = '居住在 ' + $(xmlDoc).find('player > farmName').html(); + ' 农场的居民';
		} else {
			intro = $(xmlDoc).find('player > name').html();
		}
		output += '<span class="result">' + intro + ' 已经购买了' + bought_count + ' 个姜岛升级项目，总共有 ' +
			count + ' 个</span><ul class="ach_list">\n';
		output += '<li>';
		output += (bought_count >= count) ? getMilestoneString('购买所有姜岛升级项目', 1) :
				getMilestoneString('购买所有姜岛升级项目', 0) + (count - bought_count) + ' 个 (花费 ' + cost + ' 个金色核桃)';
		output += '</li></ul></div>';

		if (bought_count < count) {
			meta.hasDetails = true;
			output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
			output += '<span class="need">未购买升级:<ol>';
			var val = 0;
			var keys = Object.keys(need);
			for (var i in keys) {
				id = keys[i];
				var extra = "";
				if (need[id] > 1) {
					extra = " -- 花费 " + need[id] + " 个金色核桃";
				}
				output += '<li>' + upgrades[id].name + extra + '</li>';				
			}
			output += '</ol></span></div>';
		}

		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + output + getSectionFooter();
		return output;
	}
	
	function parsePerfectionTracker(xmlDoc, saveInfo) {
		// Scoring details from Utility.percentGameComplete()
		var title = 'Perfection Tracker',
			anchor = makeAnchor(title),
			version = "1.5",
			sum_class = getSummaryClass(saveInfo, version),
			det_class = getDetailsClass(saveInfo, version),
			output = '',
			playerOutput = '',
			meta = { "hasDetails": false, "anchor": anchor, "sum_class": sum_class, "det_class": det_class },
			buildings = $(xmlDoc).find("locations > GameLocation[" + saveInfo.ns_prefix + "\\:type='Farm'] > buildings"),
			type,
			table = [];

		if (compareSemVer(saveInfo.version, version) < 0) {
			return '';
		}

		$(buildings).children('Building').each(function () {
			type = $(this).children('buildingType').text();
			if (saveInfo.perfectionTracker.global.hasOwnProperty(type)) {
				saveInfo.perfectionTracker.global[type] = true;
			}
		});

		table[0] = parsePlayerPerfection($(xmlDoc).find('SaveGame > player'), saveInfo, meta);
		if (saveInfo.numPlayers > 1) {
			$(xmlDoc).find('farmhand').each(function () {
				if (isValidFarmhand(this)) {
					table.push(parsePlayerPerfection(this, saveInfo, meta));
				}
			});
		}
		playerOutput += printTranspose(table);
		output = getSectionHeader(saveInfo, title, anchor, meta.hasDetails, version) + playerOutput + getSectionFooter();
		return output;
	}
	
	function parsePlayerPerfection(player, saveInfo, meta) {
		var output = '',
			table = [],
			farmer = $(player).children('name').html(),
			umid = $(player).children('UniqueMultiplayerID').text(),
			pt_pct = 0,
			left,
			places = 1,
			numObelisks = 0,
			missingObelisks = [],
			need = '';

		if (saveInfo.perfectionTracker.global["Earth Obelisk"]) { numObelisks++; } else { missingObelisks.push("土之图腾柱"); }
		if (saveInfo.perfectionTracker.global["Water Obelisk"]) { numObelisks++; } else { missingObelisks.push("水之图腾柱"); }
		if (saveInfo.perfectionTracker.global["Desert Obelisk"]) { numObelisks++; } else { missingObelisks.push("沙漠图腾柱"); }
		if (saveInfo.perfectionTracker.global["Island Obelisk"]) { numObelisks++; } else { missingObelisks.push("姜岛图腾柱"); }

		var pct = {
			"Walnuts": Math.min(saveInfo.perfectionTracker.global["Walnuts"].count / saveInfo.perfectionTracker.global["Walnuts"].total, 1),
			"Shipping": saveInfo.perfectionTracker[umid]["Shipping"].count / saveInfo.perfectionTracker[umid]["Shipping"].total,
			"Cooking": saveInfo.perfectionTracker[umid]["Cooking"].count / saveInfo.perfectionTracker[umid]["Cooking"].total,
			"Crafting": saveInfo.perfectionTracker[umid]["Crafting"].count / saveInfo.perfectionTracker[umid]["Crafting"].total,
			"Fishing": saveInfo.perfectionTracker[umid]["Fishing"].count / saveInfo.perfectionTracker[umid]["Fishing"].total,
			"Great Friends": saveInfo.perfectionTracker[umid]["Great Friends"].count / saveInfo.perfectionTracker[umid]["Great Friends"].total,
			"Skills": Math.min(saveInfo.perfectionTracker[umid]["Skills"].count / saveInfo.perfectionTracker[umid]["Skills"].total, 1)
		};
		numObelisks = Math.min(numObelisks, 4);
		
		pt_pct = numObelisks + (saveInfo.perfectionTracker.global["Gold Clock"] ? 10 : 0) +
			(saveInfo.perfectionTracker[umid]["Monsters"] ? 10 : 0) + (saveInfo.perfectionTracker[umid]["Stardrops"] ? 10 : 0) + 
			15 * pct["Shipping"] + 11 * pct["Great Friends"] + 10 * pct["Cooking"] + 10 * pct["Crafting"] + 10 * pct["Fishing"] +
			5 * pct["Walnuts"]  + 5 * pct["Skills"];
		0;	
		pt_pct = pt_pct.toFixed( (pt_pct < 100) ? 1 : 0 );
		left = 100 - pt_pct;
		left = left.toFixed( (left < 100) ? 1 : 0 );
		
		output = '<div class="' + meta.anchor + '_summary ' + meta.sum_class + '">';
		output += '<span class="result">' + farmer + ' 达成了 ' + pt_pct + '% 完美度 (详细见下面).</span>';
		output += '<ul class="ach_list"><li>';
		output += (pt_pct >= 100) ? getMilestoneString('100% 完美通关', 1) :
				getMilestoneString('100% 完美通关', 0) + left + '%';
		output += '</li></ul></div>';
		meta.hasDetails = true;
		output += '<div class="' + meta.anchor + '_details ' + meta.det_class + '">';
		output += '<span class="result">百分比分析</span>';
		output += '<ul class="ach_list"><li>';
		output += (pct["Shipping"] >= 1) ? getPerfectionPctString(pct["Shipping"], 15, '已售出的产品和采集品', 1) :
				getPerfectionPctString(pct["Shipping"], 15, '已售出的产品和采集品', 0) + ' -- <a href="#sec_Basic_Shipping">查看细节</a>';
		output += '</li><li>';
		output += (numObelisks == 4) ? getPerfectionNumString(numObelisks, 4, '农场上的图腾柱', 1) :
				getPerfectionNumString(numObelisks, 4, '农场上的图腾柱', 0) + ' -- 需要 ' + missingObelisks.join(', ');
		output += '</li><li>';
		output += getPerfectionBoolString(10, '农场上有黄金时钟', saveInfo.perfectionTracker.global["Gold Clock"]) + (saveInfo.perfectionTracker.global["Gold Clock"] ? "" : ' -- 需要摆放一个 ' + wikify("Gold Clock", undefined, undefined, undefined));
		output += '</li><li>';
		output += getPerfectionBoolString(10, '杀怪英雄 (完成探险家公会所有要求)', saveInfo.perfectionTracker[umid]["Monsters"]) + (saveInfo.perfectionTracker[umid]["Monsters"] ? "" : ' -- <a href="#sec_Monster_Hunting">查看细节</a>');
		output += '</li><li>';
		output += (pct["Great Friends"] >= 1) ? getPerfectionPctString(pct["Great Friends"], 11, '好朋友 (与所有村民达到满好感度)', 1) :
				getPerfectionPctString(pct["Great Friends"], 11, '好朋友 (与所有村民达到满好感度)', 0) + ' -- <a href="#sec_Social">查看细节</a>';
		output += '</li><li>';
		output += (pct["Skills"] >= 1) ? getPerfectionPctNumString(pct["Skills"], 5, 25, '农场主等级 (所有技能达到 10 级)', 1) :
				getPerfectionPctNumString(pct["Skills"], 5, 25, '农场主等级 (所有技能达到 10 级)', 0) + ' -- <a href="#sec_Skills">查看细节</a>';
		output += '</li><li>';
		output += getPerfectionBoolString(10, '找到所有星之果实', saveInfo.perfectionTracker[umid]["Stardrops"]) + (saveInfo.perfectionTracker[umid]["Stardrops"] ? "" : ' -- <a href="#sec_Stardrops">查看细节</a>');
		output += '</li><li>';
		output += (pct["Cooking"] >= 1) ? getPerfectionPctString(pct["Cooking"], 10, '烹饪所有菜肴', 1) :
				getPerfectionPctString(pct["Cooking"], 10, '烹饪所有菜肴', 0) + ' -- <a href="#sec_Cooking">查看细节</a>';
		output += '</li><li>';
		output += (pct["Crafting"] >= 1) ? getPerfectionPctString(pct["Crafting"], 10, '制作所有可打造物品', 1) :
				getPerfectionPctString(pct["Crafting"], 10, '制作所有可打造物品', 0) + ' -- <a href="#sec_Crafting">查看细节</a>';
		output += '</li><li>';
		output += (pct["Fishing"] >= 1) ? getPerfectionPctString(pct["Fishing"], 10, '捕获所有种类的鱼', 1) :
				getPerfectionPctString(pct["Fishing"], 10, '捕获所有种类的鱼', 0) + ' -- <a href="#sec_Fishing">查看细节</a>';
		output += '</li><li>';
		output += (pct["Walnuts"] >= 1) ? getPerfectionPctNumString(pct["Walnuts"], 5, 130, '找到姜岛上所有的金色核桃', 1) :
				getPerfectionPctNumString(pct["Walnuts"], 5, 130, '找到姜岛上所有的金色核桃', 0) + ' -- <a href="#sec_Skills">查看细节</a>';
		output += '</li></ul></div>';
		table.push(output);

		return table;
	}

	function createTOC() {
		var text,
			id,
			list = "<ul>";
		$("h2, h3").each(function () {
			if ($(this).is(":visible")) {
				text = $(this).text();
				id = 'sec_' + makeAnchor(translateWord(text, "reversed title"));
				$(this).attr('id', id);
				list += '<li><a href="#' + id + '">' + text + '</a></li>\n';
			}
		});
		list += '</ul>';
		document.getElementById('TOC-details').innerHTML = list;
	}

	function togglePlayer(e) {
		console.log("Somebody clicked on " + $(e.currentTarget).attr('id') + " which has a class of " + $(e.currentTarget).attr('class'));
		// Adjust PlayerList entry to reflect status of this player
		var isOn = ($(e.currentTarget).attr('class') === 'on'),
			match = "td." + $(e.currentTarget).attr('id').substring(5);
		$(e.currentTarget).attr('class', (isOn ? 'off' : 'on'));
		// Go find all the entries for this player and toggle them.
		$(match).each(function () {
			if ($(this).is(":visible")) {
				$(this).hide();
			} else {
				$(this).show();
			}
		});
	}
	
	function createPlayerList(numPlayers, farmer, farmhands) {
		var width = Math.floor(100 / (1 + numPlayers)),
			i,
			text = '<table><tr><th>切换玩家显示:</th>' + '<td id="List_PL_1" class="on">' + farmer + '</td>';
		for (i = 2; i <= numPlayers; i++) {
			text += ' <td id="List_PL_' + i + '" class="on">' + farmhands[i-2] + '</td>';
		}
		text += '</tr></table>';
		$("#PlayerList").html(text);
		$("#PlayerList").show();
		// Add click handlers
		for (i = 1; i <= numPlayers; i++) {
			var ID = "#List_PL_" + i;
			$(ID).click(togglePlayer);
		}
	}

	function handleFileSelect(evt) {
		var file = evt.target.files[0],
			reader = new FileReader(),
			prog = document.getElementById('progress');

		prog.value = 0;
		$('#output-container').hide();
		$('#progress-container').show();
		$('#changelog').hide();
		$('#PlayerList').hide();
		reader.onloadstart = function (e) {
			prog.value = 20;
		};
		reader.onprogress = function (e) {
			if (e.lengthComputable) {
				var p = 20 + (e.loaded / e.total * 60);
				prog.value = p;
			}
		};
		reader.onload = function (e) {
			var output = "",
				xmlDoc = $.parseXML(e.target.result),
				saveInfo = {};

			saveInfo.outputPrefOld = 'hide_details';
			var opt = document.getElementsByName('opt-old');
			if (opt !== null) {
				for(var i = 0; i < opt.length; i++){
					if(opt[i].checked){
						saveInfo.outputPrefOld = opt[i].value;
						Cookies.set('checkup-opt-old', opt[i].value, { expires: 365, path: '' });
						break;
					}
				}
			}
			saveInfo.outputPrefNew = 'hide_all';
			var opt = document.getElementsByName('opt-new');
			if (opt !== null) {
				for(var i = 0; i < opt.length; i++){
					if(opt[i].checked){
						saveInfo.outputPrefNew = opt[i].value;
						Cookies.set('checkup-opt-new', opt[i].value, { expires: 365, path: '' });
						break;
					}
				}
			}

			output += parseSummary(xmlDoc, saveInfo);
			output += parseMoney(xmlDoc, saveInfo);
			output += parseSkills(xmlDoc, saveInfo);
			output += parseQuests(xmlDoc, saveInfo);
			output += parseMonsters(xmlDoc, saveInfo);
			output += parseStardrops(xmlDoc, saveInfo);
			output += parseFamily(xmlDoc, saveInfo);
			output += parseSocial(xmlDoc, saveInfo);
			output += parseCooking(xmlDoc, saveInfo);
			output += parseCrafting(xmlDoc, saveInfo);
			output += parseFishing(xmlDoc, saveInfo);
			output += parseBasicShipping(xmlDoc, saveInfo);
			output += parseCropShipping(xmlDoc, saveInfo);
			output += parseMuseum(xmlDoc, saveInfo);
			output += parseSecretNotes(xmlDoc, saveInfo);
			output += parseBundles(xmlDoc, saveInfo);
			output += parseGrandpa(xmlDoc, saveInfo);
			output += parseSpecialOrders(xmlDoc, saveInfo);
			output += parseJournalScraps(xmlDoc, saveInfo);
			output += parseWalnuts(xmlDoc, saveInfo);
			output += parseIslandUpgrades(xmlDoc, saveInfo);
			output += parsePerfectionTracker(xmlDoc, saveInfo);

			// End of checks
			prog.value = 100;

			document.getElementById('out').innerHTML = output;

			// Now that output has been added to the page, we need to add the output-toggling to each section
			$('#output-container .collapsible').each(function() {
				$(this).children('button').click(toggleVisible);
			});

			$('#output-container').show();
			$('#progress-container').hide();
			createTOC();
			$('#TOC').show();
		};
		reader.readAsText(file);
	}
	document.getElementById('file_select').addEventListener('change', handleFileSelect, false);

/*		var t = evt.target;
		if ($(t).next().is(':visible')) {
			$(t).next().hide();
			$(t).html("Show Details");
		} else {
			$(t).next().show();
			$(t).html("Hide Details");
		}
*/
	
	function toggleVisible(evt) {
		var e = evt.target;
		var text = $(e).html();
		var theClass = '.' + $(e).attr("data-target");
		$(theClass).each(function() {
			if ($(this).is(':visible')) {
				$(this).hide();
				$(e).html(text.replace("Hide","Show"));
			} else {
				$(this).show();
				$(e).html(text.replace("Show","Hide"));
			}
		});
	}
	
	// At this point, this will only affect changelog
	$('.collapsible').each(function() {
		$(this).children('button').click(toggleVisible);
	});
	var c = Cookies.get('checkup-opt-old');
	if (typeof(c) !== 'undefined') {
		var opt = document.getElementsByName('opt-old');
		if (opt !== null) {
			for(var i = 0; i < opt.length; i++){
				if(opt[i].value === c){
					opt[i].checked = true;
					break;
				}
			}
		}
	}
	c = Cookies.get('checkup-opt-new');
	if (typeof(c) !== 'undefined') {
		var opt = document.getElementsByName('opt-new');
		if (opt !== null) {
			for(var i = 0; i < opt.length; i++){
				if(opt[i].value === c){
					opt[i].checked = true;
					break;
				}
			}
		}
	}
};