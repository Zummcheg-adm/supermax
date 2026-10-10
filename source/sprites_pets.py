"""Pets (Винни, Элли, Герда), baby Даниил in a stroller, tanks for «Танчики», chest, rattle. Imported by sprites.py."""

PAL_ADD = {
    'f': '#f6e3bd', 'F': '#dcc08a',            # cream (Элли)
    'x': '#9aa0ae', 'X': '#646a7a',            # husky grey
    'i': '#4fb3ff',                            # husky blue eyes
    'o': '#9fd0ff', 'l': '#4f8fe6',            # stroller light / dark blue
    'P': '#ff6fae',                            # pink (rattle, tongue)
    'T': '#2f2a45', 'V': '#6c6585',            # tank tracks dark / light
    'd': '#c98f4e', 'k': '#7a4f26',            # chest wood light / dark
    'I': '#e3e8f0',                            # very light grey
}

SPR = {}

# собаки в профиль (смотрят вправо): Винни — белый шпиц, Элли — кремовая мальтипу, Герда — серо-белая хаски
SPR['dog_vinni'] = [
    "...KKK......K..K....",
    "..KwwwK....KwKKwK...",
    ".KwwmwwK..KwwwwwwK..",
    ".KwmwwwwKKwwwwwwwwK.",
    "..KwwwwwKwwwwwwKwwwK",
    "...KKwwKwwwwwwwwwKKK",
    "...KwwwwwwwwwwwwKPK.",
    "..KwwwwwwwwwmwwwwK..",
    ".KwwwwwwwwwwmwwwK...",
    ".KwwwwwwwwwwwmwwwK..",
    ".KwwwwwwwwwwwwwwK...",
    ".KmwwwwwwwwwwwwwK...",
    ".KmwwwwwKwwwwwwwK...",
    ".KmwwwwwKwwwKwwwK...",
    ".KwKKwKKKwwKKwKwK...",
    "..K..K...KK..K.K....",
]
SPR['dog_elli'] = [
    "...........KKKKK....",
    "..........KffFffK...",
    ".KK......KfFfffFfK..",
    "KffK....KFFfffKfffK.",
    "KfFfK...KFFfffffffKK",
    ".KffK...KFFFffffffKK",
    "..KfK..KFFFFffffPK..",
    "..KffKKKFFFFKfffK...",
    "..KffffffFFKfffK....",
    ".KffFfffffFfffK.....",
    ".KfffffFffffffK.....",
    ".KffFfffffffFfK.....",
    ".KffffffffKfffffK...",
    ".KfFffFfffKffffFK...",
    ".KfKKfKKKffKKfKfK...",
    "..K..K...KK..K.K....",
]
SPR['dog_gerda'] = [
    ".............KK..KK.....",
    "............KxxKKxxK....",
    "...KKK.....KxxxxxxxxK...",
    "..KxxxK...KxxxxxxxxxxK..",
    "..KxIxxK..KxxxxxXiKxxxK.",
    "...KxxxxKKxxxIIIIIIIIIKK",
    "....KxxxxxxxIIIIIIIIIKKK",
    "....KxxxxxxXIIIIIIIKPK..",
    "...KxxxxxxxXIIIIIIIKK...",
    "..KxxxxxxxxxXIIIIIK.....",
    "..KxxxxxxxxxxIIIIIK.....",
    "..KxxxxxxxxxxIIIIIK.....",
    "..KxxxxxxxxxIIIIIIK.....",
    "..KXxxxxxxxKIIIIIIK.....",
    "..KXxxxxxxxKIIKIIIK.....",
    "..KIIKKIKKKIIKKIIIK.....",
    "...K..K.K..KK..KKK......",
]

# будка для Герды
SPR['kennel'] = [
    ".........KK.........",
    "........KRRK........",
    ".......KRRRRK.......",
    "......KRRrRRRK......",
    ".....KRRRRRRrRK.....",
    "....KRRrRRRRRRRK....",
    "...KRRRRRRRrRRRRK...",
    "..KKKKKKKKKKKKKKKK..",
    "...KddkddKKddkddK...",
    "...KddkdKTTKdkddK...",
    "...KkkkKTTTTKkkkK...",
    "...KddKTTTTTTKddK...",
    "...KddKTTTTTTKdkK...",
    "...KdkKTTTTTTKddK...",
    "...KddKTTTTTTKddK...",
    "...KKKKKKKKKKKKKK...",
]

# малыш Даниил в коляске
SPR['baby'] = [
    "....KKKKKK..........",
    "...KoooooooKK.......",
    "..KoooooooooooK.....",
    ".KooooooooooooooK...",
    ".KoooollllllllllK.KK",
    "KooooKKKKKKKK.....K.",
    "KoooKSSSSSSSSK...K..",
    "KoooKSKSSSSKSK..K...",
    "KoooKSZSSSSZSK.K....",
    "KoooKSSSPPSSSK.K....",
    "KKKKKKKKKKKKKKKK....",
    "KlllllllllllllllK...",
    ".KllllllllllllllK...",
    "..KKllllllllllKK....",
    "...KKKKKKKKKKKK.....",
    "...K..K....K..K.....",
    "..KKK.......KKK.....",
    "..KIK.......KIK.....",
    "..KKK.......KKK.....",
]
SPR['baby2'] = [  # улыбается, ручка вверх
    "....KKKKKK..........",
    "...KoooooooKK.......",
    "..KoooooooooooK.....",
    ".KooooooooooooooK...",
    ".KoooollllllllllK.KK",
    "KooooKKKKKKKK.....K.",
    "KoooKSSSSSSSSK...K..",
    "KoooKSKSSSSKSKK.K...",
    "KoooKSZSSSSZSKSKK...",
    "KoooKSSSPPSSSKSK....",
    "KKKKKKKKKKKKKKKK....",
    "KlllllllllllllllK...",
    ".KllllllllllllllK...",
    "..KKllllllllllKK....",
    "...KKKKKKKKKKKK.....",
    "...K..K....K..K.....",
    "..KKK.......KKK.....",
    "..KIK.......KIK.....",
    "..KKK.......KKK.....",
]

# погремушка Даниила (бонус в «Танчиках»)
SPR['rattle'] = [
    "...KKKK.....",
    "..KPPPPK....",
    ".KPPWPPPK...",
    ".KPWPPPPK...",
    ".KPPPPPPK...",
    "..KPPPPK....",
    "...KYYK.....",
    "....KYK.....",
    ".....KYK....",
    "......KYK...",
    ".......KYK..",
    "........KK..",
]

# танк Супер-Макса (смотрит вверх), два кадра гусениц
SPR['tank_p'] = [
    ".......KK.......",
    ".......KK.......",
    "KKK....KK....KKK",
    "KVTK...KK...KVTK",
    "KTTK.KKKKKK.KTTK",
    "KVTKKRRKKRRKKVTK",
    "KTTKRRKYYKRRKTTK",
    "KVTKRKYYYYKRKVTK",
    "KTTKRKYYYYKRKTTK",
    "KVTKRRKYYKRRKVTK",
    "KTTKRRRKKRRRKTTK",
    "KVTKrRRRRRRrKVTK",
    "KTTKrrrrrrrrKTTK",
    "KVTKKKKKKKKKKVTK",
    "KTTK........KTTK",
    "KKKK........KKKK",
]
SPR['tank_p2'] = [r.replace('V', '#').replace('T', 'V').replace('#', 'T') if i >= 3 else r for i, r in enumerate(SPR['tank_p'])]
# танк Глюка (фиолетовый) — на башне рисуется буква
SPR['tank_e'] = [
    ".......KK.......",
    ".......KK.......",
    "KKK....KK....KKK",
    "KVTK...KK...KVTK",
    "KTTK.KKKKKK.KTTK",
    "KVTKKGGGGGGKKVTK",
    "KTTKGGppppGGKTTK",
    "KVTKGppppppGKVTK",
    "KTTKGppppppGKTTK",
    "KVTKGGppppGGKVTK",
    "KTTKGGGGGGGGKTTK",
    "KVTKgGGGGGGgKVTK",
    "KTTKggggggggKTTK",
    "KVTKKKKKKKKKKVTK",
    "KTTK........KTTK",
    "KKKK........KKKK",
]
SPR['tank_e2'] = [r.replace('V', '#').replace('T', 'V').replace('#', 'T') if i >= 3 else r for i, r in enumerate(SPR['tank_e'])]

# сундук с буквами — его защищаем в «Танчиках»
SPR['chest'] = [
    "................",
    "..KKKKKKKKKKKK..",
    ".KddddddddddddK.",
    "KddkYddddddYkddK",
    "KdkkYdddddkYkkdK",
    "KKKKYKKKKKKYKKKK",
    "KYYYYYYKKYYYYYYK",
    "KdddYddKYKdYdddK",
    "KdkkYddKKKdYkkdK",
    "KddkYddddddYkddK",
    "KdkkYddddddYkkdK",
    "KddkYddddddYkddK",
    "KkkkYkkkkkkYkkkK",
    "KKKKKKKKKKKKKKKK",
    "................",
    "................",
]

# значок плитки «Танчики»
SPR['i_tank'] = [
    "............",
    "............",
    "....KKKK....",
    "...KWWWWKKKK",
    "...KWWWWKWWK",
    "...KWWWWKKKK",
    ".KKKKKKKKK..",
    "KWWWWWWWWWK.",
    "KWKWKWKWKWK.",
    "KWWWWWWWWWK.",
    ".KKKKKKKKK..",
    "............",
]

SPR['heart'] = [
    ".KK.KK.",
    "KRRKRRK",
    "KRWRRRK",
    "KRRRRRK",
    ".KRRRK.",
    "..KRK..",
    "...K...",
]
