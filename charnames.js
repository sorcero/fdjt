/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/string.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
   of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.charnames={"AElig": "Æ",
		"Aacgr": "Ά",
		"Aacute": "Á",
		"Abreve": "Ă",
		"Acirc": "Â",
		"Acy": "А",
		"Agr": "Α",
		"Agrave": "À",
		"Alpha": "Α",
		"Amacr": "Ā",
		"Aogon": "Ą",
		"Aring": "Å",
		"Atilde": "Ã",
		"Auml": "Ä",
		"Barwed": "⌆",
		"Bcy": "Б",
		"Beta": "Β",
		"Bgr": "Β",
		"CHcy": "Ч",
		"Cacute": "Ć",
		"Cap": "⋒",
		"Ccaron": "Č",
		"Ccedil": "Ç",
		"Ccirc": "Ĉ",
		"Cdot": "Ċ",
		"Chi": "Χ",
		"Cup": "⋓",
		"DJcy": "Ђ",
		"DScy": "Ѕ",
		"DZcy": "Џ",
		"Dagger": "‡",
		"Dcaron": "Ď",
		"Dcy": "Д",
		"Delta": "Δ",
		"Dgr": "Δ",
		"Dot": "¨",
		"DotDot": "⃜",
		"Dstrok": "Đ",
		"EEacgr": "Ή",
		"EEgr": "Η",
		"ENG": "Ŋ",
		"ETH": "Ð",
		"Eacgr": "Έ",
		"Eacute": "É",
		"Ecaron": "Ě",
		"Ecirc": "Ê",
		"Ecy": "Э",
		"Edot": "Ė",
		"Egr": "Ε",
		"Egrave": "È",
		"Emacr": "Ē",
		"Eogon": "Ę",
		"Epsilon": "Ε",
		"Eta": "Η",
		"Euml": "Ë",
		"Fcy": "Ф",
		"GJcy": "Ѓ",
		"Gamma": "Γ",
		"Gbreve": "Ğ",
		"Gcedil": "Ģ",
		"Gcirc": "Ĝ",
		"Gcy": "Г",
		"Gdot": "Ġ",
		"Gg": "⋙",
		"Ggr": "Γ",
		"Gt": "≫",
		"HARDcy": "Ъ",
		"Hcirc": "Ĥ",
		"Hstrok": "Ħ",
		"IEcy": "Е",
		"IJlig": "Ĳ",
		"IOcy": "Ё",
		"Iacgr": "Ί",
		"Iacute": "Í",
		"Icirc": "Î",
		"Icy": "И",
		"Idigr": "Ϊ",
		"Idot": "İ",
		"Igr": "Ι",
		"Igrave": "Ì",
		"Imacr": "Ī",
		"Iogon": "Į",
		"Iota": "Ι",
		"Itilde": "Ĩ",
		"Iukcy": "І",
		"Iuml": "Ï",
		"Jcirc": "Ĵ",
		"Jcy": "Й",
		"Jsercy": "Ј",
		"Jukcy": "Є",
		"KHcy": "Х",
		"KHgr": "Χ",
		"KJcy": "Ќ",
		"Kappa": "Κ",
		"Kcedil": "Ķ",
		"Kcy": "К",
		"Kgr": "Κ",
		"LJcy": "Љ",
		"Lacute": "Ĺ",
		"Lambda": "Λ",
		"Larr": "↞",
		"Lcaron": "Ľ",
		"Lcedil": "Ļ",
		"Lcy": "Л",
		"Lgr": "Λ",
		"Ll": "⋘",
		"Lmidot": "Ŀ",
		"Lstrok": "Ł",
		"Lt": "≪",
		"Mcy": "М",
		"Mgr": "Μ",
		"Mu": "Μ",
		"NJcy": "Њ",
		"Nacute": "Ń",
		"Ncaron": "Ň",
		"Ncedil": "Ņ",
		"Ncy": "Н",
		"Ngr": "Ν",
		"Ntilde": "Ñ",
		"Nu": "Ν",
		"OElig": "Œ",
		"OHacgr": "Ώ",
		"OHgr": "Ω",
		"Oacgr": "Ό",
		"Oacute": "Ó",
		"Ocirc": "Ô",
		"Ocy": "О",
		"Odblac": "Ő",
		"Ogr": "Ο",
		"Ograve": "Ò",
		"Omacr": "Ō",
		"Omega": "Ω",
		"Omicron": "Ο",
		"Oslash": "Ø",
		"Otilde": "Õ",
		"Ouml": "Ö",
		"PHgr": "Φ",
		"PSgr": "Ψ",
		"Pcy": "П",
		"Pgr": "Π",
		"Phi": "Φ",
		"Pi": "Π",
		"Prime": "″",
		"Psi": "Ψ",
		"Racute": "Ŕ",
		"Rarr": "↠",
		"Rcaron": "Ř",
		"Rcedil": "Ŗ",
		"Rcy": "Р",
		"Rgr": "Ρ",
		"Rho": "Ρ",
		"SHCHcy": "Щ",
		"SHcy": "Ш",
		"SOFTcy": "Ь",
		"Sacute": "Ś",
		"Scaron": "Š",
		"Scedil": "Ş",
		"Scirc": "Ŝ",
		"Scy": "С",
		"Sgr": "Σ",
		"Sigma": "Σ",
		"Sub": "⋐",
		"Sup": "⋑",
		"THORN": "Þ",
		"THgr": "Θ",
		"TSHcy": "Ћ",
		"TScy": "Ц",
		"Tau": "Τ",
		"Tcaron": "Ť",
		"Tcedil": "Ţ",
		"Tcy": "Т",
		"Tgr": "Τ",
		"Theta": "Θ",
		"Tstrok": "Ŧ",
		"Uacgr": "Ύ",
		"Uacute": "Ú",
		"Ubrcy": "Ў",
		"Ubreve": "Ŭ",
		"Ucirc": "Û",
		"Ucy": "У",
		"Udblac": "Ű",
		"Ugr": "Υ",
		"Ugrave": "Ù",
		"Umacr": "Ū",
		"Uogon": "Ų",
		"Upsi": "Υ",
		"Upsilon": "Υ",
		"Uring": "Ů",
		"Utilde": "Ũ",
		"Uuml": "Ü",
		"Vcy": "В",
		"Vdash": "⊩",
		"Verbar": "‖",
		"Vvdash": "⊪",
		"Wcirc": "Ŵ",
		"Xgr": "Ξ",
		"Xi": "Ξ",
		"YAcy": "Я",
		"YIcy": "Ї",
		"YUcy": "Ю",
		"Yacute": "Ý",
		"Ycirc": "Ŷ",
		"Ycy": "Ы",
		"Yuml": "Ÿ",
		"ZHcy": "Ж",
		"Zacute": "Ź",
		"Zcaron": "Ž",
		"Zcy": "З",
		"Zdot": "Ż",
		"Zeta": "Ζ",
		"Zgr": "Ζ",
		"aacgr": "ά",
		"aacute": "á",
		"abreve": "ă",
		"acirc": "â",
		"acute": "´",
		"acy": "а",
		"aelig": "æ",
		"agr": "α",
		"agrave": "à",
		"alefsym": "ℵ",
		"aleph": "ℵ",
		"alpha": "α",
		"amacr": "ā",
		"amalg": "∐",
		"amp": "&",
		"and": "∧",
		"ang": "∠",
		"ang90": "∟",
		"angmsd": "∡",
		"angsph": "∢",
		"angst": "Å",
		"aogon": "ą",
		"ap": "≈",
		"ape": "≊",
		"apos": "'",
		"aposmod": "ʼ",
		"aring": "å",
		"ast": "*",
		"asymp": "≈",
		"atilde": "ã",
		"auml": "ä",
		"b.Delta": "Δ",
		"b.Gamma": "Γ",
		"b.Lambda": "Λ",
		"b.Omega": "Ω",
		"b.Phi": "Φ",
		"b.Pi": "Π",
		"b.Psi": "Ψ",
		"b.Sigma": "Σ",
		"b.Theta": "Θ",
		"b.Upsi": "Υ",
		"b.Xi": "Ξ",
		"b.alpha": "α",
		"b.beta": "β",
		"b.chi": "χ",
		"b.delta": "δ",
		"b.epsi": "ε",
		"b.epsis": "ε",
		"b.epsiv": "ε",
		"b.eta": "η",
		"b.gamma": "γ",
		"b.gammad": "Ϝ",
		"b.iota": "ι",
		"b.kappa": "κ",
		"b.kappav": "ϰ",
		"b.lambda": "λ",
		"b.mu": "μ",
		"b.nu": "ν",
		"b.omega": "ώ",
		"b.phis": "φ",
		"b.phiv": "ϕ",
		"b.pi": "π",
		"b.piv": "ϖ",
		"b.psi": "ψ",
		"b.rho": "ρ",
		"b.rhov": "ϱ",
		"b.sigma": "σ",
		"b.sigmav": "ς",
		"b.tau": "τ",
		"b.thetas": "θ",
		"b.thetav": "ϑ",
		"b.upsi": "υ",
		"b.xi": "ξ",
		"b.zeta": "ζ",
		"barwed": "⊼",
		"bcong": "≌",
		"bcy": "б",
		"bdquo": "„",
		"becaus": "∵",
		"bepsi": "∍",
		"bernou": "ℬ",
		"beta": "β",
		"beth": "ℶ",
		"bgr": "β",
		"blackstar": "✦",
		"blank": "␣",
		"blk12": "▒",
		"blk14": "░",
		"blk34": "▓",
		"block": "█",
		"bottom": "⊥",
		"bowtie": "⋈",
		"boxDL": "╗",
		"boxDR": "╔",
		"boxDl": "╖",
		"boxDr": "╓",
		"boxH": "═",
		"boxHD": "╦",
		"boxHU": "╩",
		"boxHd": "╤",
		"boxHu": "╧",
		"boxUL": "╝",
		"boxUR": "╚",
		"boxUl": "╜",
		"boxUr": "╙",
		"boxV": "║",
		"boxVH": "╬",
		"boxVL": "╣",
		"boxVR": "╠",
		"boxVh": "╫",
		"boxVl": "╢",
		"boxVr": "╟",
		"boxdL": "╕",
		"boxdR": "╒",
		"boxdl": "┐",
		"boxdr": "┌",
		"boxh": "─",
		"boxhD": "╥",
		"boxhU": "╨",
		"boxhd": "┬",
		"boxhu": "┴",
		"boxuL": "╛",
		"boxuR": "╘",
		"boxul": "┘",
		"boxur": "└",
		"boxv": "│",
		"boxvH": "╪",
		"boxvL": "╡",
		"boxvR": "╞",
		"boxvh": "┼",
		"boxvl": "┤",
		"boxvr": "├",
		"bprime": "‵",
		"breve": "˘",
		"brvbar": "¦",
		"bsim": "∽",
		"bsime": "⋍",
		"bsol": "\\",
		"bull": "•",
		"bump": "≎",
		"bumpe": "≏",
		"cacute": "ć",
		"cap": "∩",
		"caret": "⁁",
		"caron": "ˇ",
		"ccaron": "č",
		"ccedil": "ç",
		"ccirc": "ĉ",
		"cdot": "ċ",
		"cedil": "¸",
		"cent": "¢",
		"chcy": "ч",
		"check": "✓",
		"chi": "χ",
		"cir": "○",
		"circ": "ˆ",
		"cire": "≗",
		"clubs": "♣",
		"colon": ":",
		"colone": "≔",
		"comma": ",",
		"commat": "@",
		"comp": "∁",
		"compfn": "∘",
		"cong": "≅",
		"conint": "∮",
		"coprod": "∐",
		"copy": "©",
		"copysr": "℗",
		"crarr": "↵",
		"cross": "✗",
		"cuepr": "⋞",
		"cuesc": "⋟",
		"cularr": "↶",
		"cup": "∪",
		"cupre": "≼",
		"curarr": "↷",
		"curren": "¤",
		"cuvee": "⋎",
		"cuwed": "⋏",
		"dArr": "⇓",
		"dagger": "†",
		"daleth": "ℸ",
		"darr": "↓",
		"darr2": "⇊",
		"dash": "‐",
		"dashv": "⊣",
		"dblac": "˝",
		"dcaron": "ď",
		"dcy": "д",
		"deg": "°",
		"delta": "δ",
		"dgr": "δ",
		"dharl": "⇃",
		"dharr": "⇂",
		"diam": "⋄",
		"diams": "♦",
		"die": "¨",
		"divide": "÷",
		"divonx": "⋇",
		"djcy": "ђ",
		"dlarr": "↙",
		"dlcorn": "⌞",
		"dlcrop": "⌍",
		"dollar": "$",
		"dot": "˙",
		"drarr": "↘",
		"drcorn": "⌟",
		"drcrop": "⌌",
		"dscy": "ѕ",
		"dstrok": "đ",
		"dtri": "▿",
		"dtrif": "▾",
		"dzcy": "џ",
		"eDot": "≑",
		"eacgr": "έ",
		"eacute": "é",
		"ecaron": "ě",
		"ecir": "≖",
		"ecirc": "ê",
		"ecolon": "≕",
		"ecy": "э",
		"edot": "ė",
		"eeacgr": "ή",
		"eegr": "η",
		"efDot": "≒",
		"egr": "ε",
		"egrave": "è",
		"egs": "⋝",
		"ell": "ℓ",
		"els": "⋜",
		"emacr": "ē",
		"empty": "∅",
		"emsp": " ",
		"emsp13": " ",
		"emsp14": " ",
		"eng": "ŋ",
		"ensp": " ",
		"eogon": "ę",
		"epsi": "ε",
		"epsilon": "ε",
		"epsis": "∊",
		"epsiv": "ο",
		"equals": "=",
		"equiv": "≡",
		"erDot": "≓",
		"esdot": "≐",
		"eta": "η",
		"eth": "ð",
		"euml": "ë",
		"euro": "€",
		"excl": "!",
		"exist": "∃",
		"fcy": "ф",
		"female": "♀",
		"ffilig": "ﬃ",
		"fflig": "ﬀ",
		"ffllig": "ﬄ",
		"filig": "ﬁ",
		"flat": "♭",
		"fllig": "ﬂ",
		"fnof": "ƒ",
		"forall": "∀",
		"fork": "⋔",
		"frac12": "½",
		"frac13": "⅓",
		"frac14": "¼",
		"frac15": "⅕",
		"frac16": "⅙",
		"frac18": "⅛",
		"frac23": "⅔",
		"frac25": "⅖",
		"frac34": "¾",
		"frac35": "⅗",
		"frac38": "⅜",
		"frac45": "⅘",
		"frac56": "⅚",
		"frac58": "⅝",
		"frac78": "⅞",
		"frasl": "⁄",
		"frown": "⌢",
		"gE": "≧",
		"gEl": "⪌",
		"gacute": "ǵ",
		"gamma": "γ",
		"gammad": "Ϝ",
		"gap": "⪆",
		"gbreve": "ğ",
		"gcedil": "ģ",
		"gcirc": "ĝ",
		"gcy": "г",
		"gdot": "ġ",
		"ge": "≥",
		"gel": "⋛",
		"ges": "≥",
		"ggr": "γ",
		"gimel": "ℷ",
		"gjcy": "ѓ",
		"gl": "≷",
		"gnE": "≩",
		"gnap": "⪊",
		"gne": "≩",
		"gnsim": "⋧",
		"grave": "`",
		"gsdot": "⋗",
		"gsim": "≳",
		"gt": ">",
		"gvnE": "≩",
		"hArr": "⇔",
		"hairsp": " ",
		"half": "½",
		"hamilt": "ℋ",
		"hardcy": "ъ",
		"harr": "↔",
		"harrw": "↭",
		"hcirc": "ĥ",
		"hearts": "♥",
		"hellip": "…",
		"horbar": "―",
		"hstrok": "ħ",
		"hybull": "⁃",
		"hyphen": "-",
		"iacgr": "ί",
		"iacute": "í",
		"icirc": "î",
		"icy": "и",
		"idiagr": "ΐ",
		"idigr": "ϊ",
		"iecy": "е",
		"iexcl": "¡",
		"iff": "⇔",
		"igr": "ι",
		"igrave": "ì",
		"ijlig": "ĳ",
		"imacr": "ī",
		"image": "ℑ",
		"incare": "℅",
		"infin": "∞",
		"inodot": "ı",
		"int": "∫",
		"intcal": "⊺",
		"iocy": "ё",
		"iogon": "į",
		"iota": "ι",
		"iquest": "¿",
		"isin": "∈",
		"itilde": "ĩ",
		"iukcy": "і",
		"iuml": "ï",
		"jcirc": "ĵ",
		"jcy": "й",
		"jsercy": "ј",
		"jukcy": "є",
		"kappa": "κ",
		"kappav": "ϰ",
		"kcedil": "ķ",
		"kcy": "к",
		"kgr": "κ",
		"kgreen": "ĸ",
		"khcy": "х",
		"khgr": "χ",
		"kjcy": "ќ",
		"lAarr": "⇚",
		"lArr": "⇐",
		"lE": "≦",
		"lEg": "⪋",
		"lacute": "ĺ",
		"lagran": "ℒ",
		"lambda": "λ",
		"lang": "〈",
		"lap": "⪅",
		"laquo": "«",
		"larr": "←",
		"larr2": "⇇",
		"larrhk": "↩",
		"larrlp": "↫",
		"larrtl": "↢",
		"lcaron": "ľ",
		"lcedil": "ļ",
		"lceil": "⌈",
		"lcub": "{",
		"lcy": "л",
		"ldot": "⋖",
		"ldquo": "“",
		"ldquor": "„",
		"le": "≤",
		"leg": "⋚",
		"les": "≤",
		"lfloor": "⌊",
		"lg": "≶",
		"lgr": "λ",
		"lhard": "↽",
		"lharu": "↼",
		"lhblk": "▄",
		"ljcy": "љ",
		"lmidot": "ŀ",
		"lnE": "≨",
		"lnap": "⪉",
		"lne": "≨",
		"lnsim": "⋦",
		"lowast": "∗",
		"lowbar": "_",
		"loz": "◊",
		"lozf": "✦",
		"lpar": "(",
		"lrarr2": "⇆",
		"lrhar2": "⇋",
		"lrm": "‎",
		"lsaquo": "‹",
		"lsh": "↰",
		"lsim": "≲",
		"lsqb": "[",
		"lsquo": "‘",
		"lsquor": "‚",
		"lstrok": "ł",
		"lt": "<",
		"lthree": "⋋",
		"ltimes": "⋉",
		"ltri": "◃",
		"ltrie": "⊴",
		"ltrif": "◂",
		"lvnE": "≨",
		"macr": "¯",
		"male": "♂",
		"malt": "✠",
		"map": "↦",
		"marker": "▮",
		"mcy": "м",
		"mdash": "—",
		"mgr": "μ",
		"micro": "µ",
		"mid": "∣",
		"middot": "·",
		"minus": "−",
		"minusb": "⊟",
		"mldr": "…",
		"mnplus": "∓",
		"models": "⊧",
		"mu": "μ",
		"mumap": "⊸",
		"nVDash": "⊯",
		"nVdash": "⊮",
		"nabla": "∇",
		"nacute": "ń",
		"nap": "≉",
		"napos": "ŉ",
		"natur": "♮",
		"nbsp": " ",
		"ncaron": "ň",
		"ncedil": "ņ",
		"ncong": "≇",
		"ncy": "н",
		"ndash": "–",
		"ne": "≠",
		"nearr": "↗",
		"nequiv": "≢",
		"nexist": "∄",
		"nge": "≱",
		"nges": "≱",
		"ngr": "ν",
		"ngt": "≯",
		"nhArr": "⇎",
		"nharr": "↮",
		"ni": "∋",
		"njcy": "њ",
		"nlArr": "⇍",
		"nlarr": "↚",
		"nldr": "‥",
		"nle": "≰",
		"nles": "≰",
		"nlt": "≮",
		"nltri": "⋪",
		"nltrie": "⋬",
		"nmid": "∤",
		"not": "¬",
		"notin": "∉",
		"npar": "∦",
		"npr": "⊀",
		"npre": "⋠",
		"nrArr": "⇏",
		"nrarr": "↛",
		"nrtri": "⋫",
		"nrtrie": "⋭",
		"nsc": "⊁",
		"nsce": "⋡",
		"nsim": "≁",
		"nsime": "≄",
		"nsmid": "∤",
		"nspar": "∦",
		"nsub": "⊄",
		"nsubE": "⊈",
		"nsube": "⊈",
		"nsup": "⊅",
		"nsupE": "⊉",
		"nsupe": "⊉",
		"ntilde": "ñ",
		"nu": "ν",
		"num": "#",
		"numero": "№",
		"numsp": " ",
		"nvDash": "⊭",
		"nvdash": "⊬",
		"oS": "Ⓢ",
		"oacgr": "ό",
		"oacute": "ó",
		"oast": "⊛",
		"ocir": "⊚",
		"ocirc": "ô",
		"ocy": "о",
		"odash": "⊝",
		"odblac": "ő",
		"odot": "⊙",
		"oelig": "œ",
		"ogon": "˛",
		"ogr": "ο",
		"ograve": "ò",
		"ohacgr": "ώ",
		"ohgr": "ω",
		"ohm": "Ω",
		"olarr": "↺",
		"oline": "‾",
		"omacr": "ō",
		"omega": "ω",
		"omicron": "ο",
		"ominus": "⊖",
		"oplus": "⊕",
		"or": "∨",
		"orarr": "↻",
		"order": "ℴ",
		"ordf": "ª",
		"ordm": "º",
		"oslash": "ø",
		"osol": "⊘",
		"otilde": "õ",
		"otimes": "⊗",
		"ouml": "ö",
		"par": "∥",
		"para": "¶",
		"part": "∂",
		"pcy": "п",
		"percnt": "%",
		"period": ".",
		"permil": "‰",
		"perp": "⊥",
		"pgr": "π",
		"phgr": "φ",
		"phi": "φ",
		"phis": "φ",
		"phiv": "ϕ",
		"phmmat": "ℳ",
		"phone": "☎",
		"pi": "π",
		"piv": "ϖ",
		"planck": "ℏ",
		"plus": "+",
		"plusb": "⊞",
		"plusdo": "∔",
		"plusmn": "±",
		"pound": "£",
		"pr": "≺",
		"prap": "⪷",
		"pre": "≼",
		"prime": "′",
		"prnE": "⪵",
		"prnap": "⪹",
		"prnsim": "⋨",
		"prod": "∏",
		"prop": "∝",
		"prsim": "≾",
		"psgr": "ψ",
		"psi": "ψ",
		"puncsp": " ",
		"quest": "?",
		"quot": "\"",
		"rAarr": "⇛",
		"rArr": "⇒",
		"racute": "ŕ",
		"radic": "√",
		"rang": "〉",
		"raquo": "»",
		"rarr": "→",
		"rarr2": "⇉",
		"rarrhk": "↪",
		"rarrlp": "↬",
		"rarrtl": "↣",
		"rarrw": "↝",
		"rcaron": "ř",
		"rcedil": "ŗ",
		"rceil": "⌉",
		"rcub": "}",
		"rcy": "р",
		"rdquo": "”",
		"rdquor": "“",
		"real": "ℜ",
		"rect": "▭",
		"reg": "®",
		"rfloor": "⌋",
		"rgr": "ρ",
		"rhard": "⇁",
		"rharu": "⇀",
		"rho": "ρ",
		"rhov": "ϱ",
		"ring": "˚",
		"rlarr2": "⇄",
		"rlhar2": "⇌",
		"rlm": "‏",
		"rpar": ")",
		"rpargt": "⦔",
		"rsaquo": "›",
		"rsh": "↱",
		"rsqb": "]",
		"rsquo": "’",
		"rsquor": "‘",
		"rthree": "⋌",
		"rtimes": "⋊",
		"rtri": "▹",
		"rtrie": "⊵",
		"rtrif": "▸",
		"rx": "℞",
		"sacute": "ś",
		"samalg": "∐",
		"sbquo": "‚",
		"sbsol": "\\",
		"sc": "≻",
		"scap": "⪸",
		"scaron": "š",
		"sccue": "≽",
		"sce": "≽",
		"scedil": "ş",
		"scirc": "ŝ",
		"scnE": "⪶",
		"scnap": "⪺",
		"scnsim": "⋩",
		"scsim": "≿",
		"scy": "с",
		"sdot": "⋅",
		"sdotb": "⊡",
		"sect": "§",
		"semi": ";",
		"setmn": "∖",
		"sext": "✶",
		"sfgr": "ς",
		"sfrown": "⌢",
		"sgr": "σ",
		"sharp": "♯",
		"shchcy": "щ",
		"shcy": "ш",
		"shy": "­",
		"sigma": "σ",
		"sigmaf": "ς",
		"sigmav": "ς",
		"sim": "∼",
		"sime": "≃",
		"smid": "∣",
		"smile": "⌣",
		"softcy": "ь",
		"sol": "/",
		"spades": "♠",
		"spar": "∥",
		"sqcap": "⊓",
		"sqcup": "⊔",
		"sqsub": "⊏",
		"sqsube": "⊑",
		"sqsup": "⊐",
		"sqsupe": "⊒",
		"squ": "□",
		"square": "□",
		"squf": "▪",
		"ssetmn": "∖",
		"ssmile": "⌣",
		"sstarf": "⋆",
		"star": "☆",
		"starf": "★",
		"sub": "⊂",
		"subE": "⊆",
		"sube": "⊆",
		"subnE": "⊊",
		"subne": "⊊",
		"sum": "∑",
		"sung": "♪",
		"sup": "⊃",
		"sup1": "¹",
		"sup2": "²",
		"sup3": "³",
		"supE": "⊇",
		"supe": "⊇",
		"supnE": "⊋",
		"supne": "⊋",
		"szlig": "ß",
		"target": "⌖",
		"tau": "τ",
		"tcaron": "ť",
		"tcedil": "ţ",
		"tcy": "т",
		"tdot": "⃛",
		"telrec": "⌕",
		"tgr": "τ",
		"there4": "∴",
		"theta": "θ",
		"thetas": "θ",
		"thetasym": "ϑ",
		"thetav": "ϑ",
		"thgr": "θ",
		"thinsp": " ",
		"thkap": "≈",
		"thksim": "∼",
		"thorn": "þ",
		"tilde": "˜",
		"times": "×",
		"timesb": "⊠",
		"top": "⊤",
		"tprime": "‴",
		"trade": "™",
		"trie": "≜",
		"tscy": "ц",
		"tshcy": "ћ",
		"tstrok": "ŧ",
		"twixt": "≬",
		"uArr": "⇑",
		"uacgr": "ύ",
		"uacute": "ú",
		"uarr": "↑",
		"uarr2": "⇈",
		"ubrcy": "ў",
		"ubreve": "ŭ",
		"ucirc": "û",
		"ucy": "у",
		"udblac": "ű",
		"udiagr": "ΰ",
		"udigr": "ϋ",
		"ugr": "υ",
		"ugrave": "ù",
		"uharl": "↿",
		"uharr": "↾",
		"uhblk": "▀",
		"ulcorn": "⌜",
		"ulcrop": "⌏",
		"umacr": "ū",
		"uml": "¨",
		"uogon": "ų",
		"uplus": "⊎",
		"upsi": "υ",
		"upsih": "ϒ",
		"upsilon": "υ",
		"urcorn": "⌝",
		"urcrop": "⌎",
		"uring": "ů",
		"utilde": "ũ",
		"utri": "▵",
		"utrif": "▴",
		"uuml": "ü",
		"vArr": "⇕",
		"vDash": "⊨",
		"varr": "↕",
		"vcy": "в",
		"vdash": "⊢",
		"veebar": "⊻",
		"vellip": "⋮",
		"verbar": "|",
		"vltri": "⊲",
		"vprime": "′",
		"vprop": "∝",
		"vrtri": "⊳",
		"vsubnE": "⊊",
		"vsubne": "⊊",
		"vsupnE": "⊋",
		"vsupne": "⊋",
		"wcirc": "ŵ",
		"wedgeq": "≙",
		"weierp": "℘",
		"whitestar": "✧",
		"wreath": "≀",
		"xcirc": "○",
		"xdtri": "▽",
		"xgr": "ξ",
		"xhArr": "↔",
		"xharr": "↔",
		"xi": "ξ",
		"xlArr": "⇐",
		"xrArr": "⇒",
		"xutri": "△",
		"yacute": "ý",
		"yacy": "я",
		"ycirc": "ŷ",
		"ycy": "ы",
		"yen": "¥",
		"yicy": "ї",
		"yucy": "ю",
		"yuml": "ÿ",
		"zacute": "ź",
		"zcaron": "ž",
		"zcy": "з",
		"zdot": "ż",
		"zeta": "ζ",
		"zgr": "ζ",
		"zhcy": "ж",
		"zwj": "‍",
		"zwnj": "‌"};


