"""Pixel sprites for the letter game. Each sprite: palette + rows. '.' = transparent."""
import json

PAL = {
    'K': '#1b1530',  # ink
    'W': '#ffffff',
    'H': '#4a2a17', 'h': '#6e4024',              # hair
    'S': '#f7c8a0', 's': '#e2a77c',              # skin
    'M': '#1f57d6',                              # mask
    'R': '#e8363f', 'r': '#b01f2b',              # suit
    'Y': '#ffc62e', 'y': '#d99a12',              # yellow
    'C': '#2a6cf0', 'c': '#1b45a8',              # cape
    'G': '#8e4fe0', 'g': '#6a33b3', 'p': '#c49bff',  # villain purple
    'L': '#9ffcf6', 'D': '#22c4bd',              # gem
    'O': '#ff8a1f',                              # orange
    'A': '#9aa0aa', 'a': '#5f6470',              # steel grey
    'U': '#2f6fe0', 'u': '#1b45a8',              # blue
    'E': '#5cb84a',                              # green
}

SPR = {}

SPR['hero'] = [
    "....KKKKKKKK....",
    "...KHHHHHHhHK...",
    "..KHHHHHHHHhHK..",
    "..KHHHHHHHHHHK..",
    "..KHSSHHHHSSHK..",
    "..KSSSSSSSSSSK..",
    "..KMMMMMMMMMMK..",
    "..KMWWMMMMWWMK..",
    "..KMWKMMMMKWMK..",
    "..KSSSSSSSSSSK..",
    "..KSSKSSSSKSSK..",
    "...KSSKKKKSSK...",
    "....KKSSSSKK....",
    "..cCKKKKKKKKCc..",
    ".cCKRRRYYRRRKCc.",
    ".cKRRRYRRYRRRKc.",
    "cCKRRRYYYYRRRKCc",
    "cKSKRrRYYRrRKSKc",
    "cKCKRRRRRRRRKCKc",
    "cKKKYYYYYYYYKKKc",
    "c..KRRRKKRRRK..c",
    "...KRRRKKRRRK...",
    "...KCCCKKCCCK...",
    "..KKKKK..KKKKK..",
]

SPR['hero2'] = [  # cape flutter frame
    "....KKKKKKKK....",
    "...KHHHHHHhHK...",
    "..KHHHHHHHHhHK..",
    "..KHHHHHHHHHHK..",
    "..KHSSHHHHSSHK..",
    "..KSSSSSSSSSSK..",
    "..KMMMMMMMMMMK..",
    "..KMWWMMMMWWMK..",
    "..KMWKMMMMKWMK..",
    "..KSSSSSSSSSSK..",
    "..KSSKSSSSKSSK..",
    "...KSSKKKKSSK...",
    "....KKSSSSKK....",
    "..cCKKKKKKKKCc..",
    ".cCKRRRYYRRRKCc.",
    "cCKRRRYRRYRRRKCc",
    "cCKRRRYYYYRRRKCc",
    "cKSKRrRYYRrRKSKc",
    "cKCKRRRRRRRRKCKc",
    "cKKKYYYYYYYYKKKc",
    ".c.KRRRKKRRRK.c.",
    "c..KRRRKKRRRK..c",
    "...KCCCKKCCCK...",
    "..KKKKK..KKKKK..",
]

SPR['glitch'] = [
    "...K........K...",
    "..KpK......KpK..",
    "...KGK....KGK...",
    "....KGGGGGGK....",
    "...KGGpGGGGGK...",
    "..KGGpGGGGGGGK..",
    ".KGGGWWWWWWGGGK.",
    ".KGGWWWWKKWWGGK.",
    ".KGGWWWKKKKWGGK.",
    ".KGGWWWWKKWWGGK.",
    ".KGGGWWWWWWGGGK.",
    ".KGgGGGGGGGGgGK.",
    ".KGGKWKWKWKWGGK.",
    ".KGGGKKKKKKGGGK.",
    "..KGgGGGGGGgGK..",
    "...KKK.KK.KKK...",
]

SPR['gem'] = [
    "...KKKKK...",
    "..KLLWLLK..",
    ".KLLWLLLLK.",
    "KDDDDDDDDDK",
    ".KDLLLLLDK.",
    "..KDLLLDK..",
    "...KDLDK...",
    "....KDK....",
    ".....K.....",
]

SPR['star'] = [
    ".....K.....",
    "....KYK....",
    "....KYK....",
    "KKKKYYYKKKK",
    ".KYYYYYYYK.",
    "..KYYYYYK..",
    "..KYYKYYK..",
    ".KYYK.KYYK.",
    ".KKK...KKK.",
]

SPR['i_home'] = [
    ".....KK.....",
    "....KWWK....",
    "...KWWWWK...",
    "..KWWWWWWK..",
    ".KWWWWWWWWK.",
    "KKWWWWWWWWKK",
    ".KWWWWWWWWK.",
    ".KWWKKKWWWK.",
    ".KWWKYKWWWK.",
    ".KWWKYKWWWK.",
    ".KWWKYKWWWK.",
    ".KKKKKKKKKK.",
]

SPR['i_sound'] = [
    "..............",
    ".....KK....K..",
    "....KWK..K..K.",
    "KKKKWWK...K.K.",
    "KWWWWWK.K..K.K",
    "KWWWWWK..K.K.K",
    "KWWWWWK..K.K.K",
    "KWWWWWK.K..K.K",
    "KKKKWWK...K.K.",
    "....KWK..K..K.",
    ".....KK....K..",
    "..............",
]

SPR['i_play'] = [
    "KK..........",
    "KWKK........",
    "KWWWKK......",
    "KWWWWWKK....",
    "KWWWWWWWKK..",
    "KWWWWWWWWWKK",
    "KWWWWWWWWWKK",
    "KWWWWWWWKK..",
    "KWWWWWKK....",
    "KWWWKK......",
    "KWKK........",
    "KK..........",
]

SPR['i_gear'] = [
    "....KKKK....",
    "..K.KWWK.K..",
    ".KWKKWWKKWK.",
    "..KWWWWWWK..",
    "KKKWWKKWWKKK",
    "KWWWK..KWWWK",
    "KWWWK..KWWWK",
    "KKKWWKKWWKKK",
    "..KWWWWWWK..",
    ".KWKKWWKKWK.",
    "..K.KWWK.K..",
    "....KKKK....",
]

SPR['i_pencil'] = [
    "........KKK.",
    ".......KRRRK",
    "......KYKRRK",
    ".....KYYYKK.",
    "....KYYYYK..",
    "...KYYYYK...",
    "..KYYYYK....",
    ".KSYYYK.....",
    ".KSSYK......",
    "KKSSK.......",
    "KKKK........",
    "............",
]

SPR['i_book'] = [
    ".............",
    ".KKKKK.KKKKK.",
    "KWWWWWKWWWWWK",
    "KWKKKWKWKKKWK",
    "KWWWWWKWWWWWK",
    "KWKKKWKWKKKWK",
    "KWWWWWKWWWWWK",
    "KWKKKWKWKKKWK",
    "KWWWWWKWWWWWK",
    "KWWWWWKWWWWWK",
    ".KKKKKKKKKKK.",
    ".............",
]

SPR['i_target'] = [
    "....KKKK....",
    "..KKRRRRKK..",
    ".KRRWWWWRRK.",
    ".KRWWRRWWRK.",
    "KRWWRWWRWWRK",
    "KRWRWRRWRWRK",
    "KRWRWRRWRWRK",
    "KRWWRWWRWWRK",
    ".KRWWRRWWRK.",
    ".KRRWWWWRRK.",
    "..KKRRRRKK..",
    "....KKKK....",
]

SPR['i_castle'] = [
    "K.K.K..K.K.K",
    "KKKKK..KKKKK",
    "KWWWK..KWWWK",
    "KWWWKKKKWWWK",
    "KWWWWWWWWWWK",
    "KWKWWWWWWKWK",
    "KWKWWKKWWKWK",
    "KWWWKKKKWWWK",
    "KWWWKKKKWWWK",
    "KWWWKKKKWWWK",
    "KKKKKKKKKKKK",
    "............",
]

SPR['i_eye'] = [
    "............",
    "............",
    "....KKKK....",
    "..KKWWWWKK..",
    ".KWWWKKWWWK.",
    "KWWWKKKKWWWK",
    "KWWWKKWKWWWK",
    ".KWWWKKWWWK.",
    "..KKWWWWKK..",
    "....KKKK....",
    "............",
    "............",
]

SPR['i_reset'] = [
    "....KKKK..K.",
    "..KKWWWWKKWK",
    ".KWWKKKKWWWK",
    ".KWK...KWWWK",
    "KWK...KKKKKK",
    "KWK.........",
    "KWK.........",
    "KWK......KWK",
    ".KWK....KWK.",
    ".KWWKKKKWWK.",
    "..KKWWWWKK..",
    "....KKKK....",
]

SPR['i_lock'] = [
    "...KKKKK....",
    "..KAAAAAK...",
    ".KAK...KAK..",
    ".KAK...KAK..",
    "KKKKKKKKKKK.",
    "KYYYYYYYYYK.",
    "KYYYKKYYYYK.",
    "KYYYKKYYYYK.",
    "KYYYYKYYYYK.",
    "KyyyyyyyyyK.",
    "KKKKKKKKKKK.",
    "............",
]

SPR['i_check'] = [
    "..........KK",
    ".........KWK",
    "........KWWK",
    ".......KWWK.",
    "KK....KWWK..",
    "KWK..KWWK...",
    "KWWKKWWK....",
    ".KWWWWK.....",
    "..KWWK......",
    "...KK.......",
    "............",
    "............",
]

SPR['i_back'] = [
    "....KK......",
    "...KWK......",
    "..KWWKKKKKK.",
    ".KWWWWWWWWWK",
    "KWWWWWWWWWWK",
    ".KWWWWWWWWWK",
    "..KWWKKKKKK.",
    "...KWK......",
    "....KK......",
    "............",
    "............",
    "............",
]

# picture sprites for words without a good emoji
SPR['p_yula'] = [
    "......KK......",
    "......KK......",
    "....KKKKKK....",
    "..KKRRRRRRKK..",
    ".KRRRWRRRRRRK.",
    "KYYYYYYYYYYYYK",
    "KYWYYYYYYYYYYK",
    ".KUUUUUUUUUUK.",
    "..KUUUUUUUUK..",
    "...KKUUUUKK...",
    ".....KUUK.....",
    "......KK......",
]

SPR['p_excavator'] = [
    "...........KKK......",
    "..........KYYyK.....",
    ".........KYYyK.K....",
    "........KYYyK..KK...",
    "...KKKKKYYyK...KaK..",
    "..KYYYYKYyK....KaaK.",
    "..KYLLYKYYK...KaaaK.",
    "..KYLLYYYYYK..KKKK..",
    ".KYYYYYYYYYYK.......",
    ".KyyyyyyyyyyK.......",
    "KKKKKKKKKKKKKK......",
    "KaAaAaAaAaAaAK......",
    ".KKKKKKKKKKKK.......",
]


def render(name, scale=12):
    from PIL import Image
    rows = SPR[name]
    w = max(len(r) for r in rows)
    h = len(rows)
    im = Image.new('RGBA', (w * scale, h * scale), (200, 230, 255, 255))
    px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.':
                continue
            col = PAL[ch]
            rgb = tuple(int(col[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
            for yy in range(scale):
                for xx in range(scale):
                    px[x * scale + xx, y * scale + yy] = rgb
    return im


def sheet(path):
    from PIL import Image
    ims = [(n, render(n, 10)) for n in SPR]
    W = sum(i.width for _, i in ims) + 20 * len(ims)
    H = max(i.height for _, i in ims) + 20
    out = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    x = 10
    for _, i in ims:
        out.paste(i, (x, 10))
        x += i.width + 20
    out.save(path)


def to_json():
    return json.dumps({'pal': PAL, 'spr': SPR}, ensure_ascii=False)


if __name__ == '__main__':
    import sys
    sheet(sys.argv[1] if len(sys.argv) > 1 else 'sheet.png')
    for n in SPR:
        widths = {len(r) for r in SPR[n]}
        if len(widths) != 1:
            print('UNEVEN', n, widths)
