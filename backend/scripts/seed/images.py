"""Unsplash image URLs used by the demo seed."""

# Reusable high quality Unsplash photos for staff and client avatars
AVATAR_IMAGES = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
]


def _unsplash(photo_id: str, *, w: int = 800) -> str:
    return f"https://images.unsplash.com/{photo_id}?w={w}&auto=format&fit=crop&q=80"


# Distinct hair salon service covers (haircutting, coloring, washing, blowouts, barbershop, styling chairs)
SERVICE_COVER_IMAGES = [
    _unsplash(
        "photo-1560066984-138dadb4c035"
    ),  # Modern luxury hair salon interior with stylist working
    _unsplash("photo-1522337360788-8b13dee7a37e"),  # Hairstylist cutting hair with shears and comb
    _unsplash("photo-1562322140-8baeececf3df"),  # Hair wash basin shampoo conditioning treatment
    _unsplash("photo-1605497788044-5a32c7078486"),  # Blowout styling session with round brush
    _unsplash("photo-1521590832167-7bcbfaa6381f"),  # Blow dry styling with nozzle and comb
    _unsplash("photo-1595476108010-b4d1f102b1b1"),  # Balayage hair coloring foils application
    _unsplash("photo-1580618672591-eb180b1a973f"),  # Hair salon mirrors, stations and swivel chairs
    _unsplash("photo-1503951914875-452162b0f3f1"),  # Barber haircut with scissors and comb
    _unsplash("photo-1585747860715-2ba37e788b70"),  # Barbershop styling session in leather chair
    _unsplash("photo-1599351431202-1e0f0137899a"),  # Precision barber scissor haircut
    _unsplash("photo-1622286342621-4bd786c2447c"),  # Barber taper fade clippers grooming
    _unsplash("photo-1527799820374-dcf8d9d4a388"),  # Salon hair highlighting and foils
    _unsplash("photo-1519699047748-de8e457a634e"),  # Silky styled wavy blowout finish
    _unsplash("photo-1512496015851-a90fb38ba796"),  # Salon shampoo basin wash treatment
    _unsplash("photo-1634449577252-3e8e2d4c4d4a"),  # Hair sectioning and thermal styling
    _unsplash("photo-1633681926022-84c203e2e1e1"),  # Razor lineup and barber beard trim
    _unsplash("photo-1516975080664-ed2fc6a32937"),  # Salon hair treatment and conditioning
    _unsplash("photo-1522335789203-aabd1fc54bc9"),  # Salon styling brushes, clips, and scissors
    _unsplash("photo-1596704017254-9b121068fb31"),  # Neat stitch braids and scalp cornrows styling
    _unsplash("photo-1582095133179-bfd08e2fc6b3"),  # Salon leather styling chairs and mirrors
    _unsplash("photo-1560869713-7d0a29430803"),  # Salon tools, brushes, and blow dryer station
    _unsplash("photo-1522337094846-8a818192de1f"),  # Hairstylist curling hair with iron wand
    _unsplash("photo-1516726817505-f5ed825624d2"),  # Precision haircut finish in salon chair
    _unsplash("photo-1521119984829-b74d2c7b5cdb"),  # Barber sharp taper fade cut
    _unsplash("photo-1500917293891-ef795e70e1f6"),  # Polished blowout and silky finish
    _unsplash("photo-1519415518177-036825c1a910"),  # Deep moisture hair steaming and treatment
    _unsplash("photo-1607779097040-29e887df438a"),  # Scalp scrub and hair wash basin
    _unsplash("photo-1620331311520-246422fd82ea"),  # Thermal styling and curling waves
    _unsplash("photo-1526045478516-99145907023c"),  # Salon consultation and hair prep
    _unsplash("photo-1570172619644-dfd03ed5d881"),  # Salon hair care station
    _unsplash("photo-1583001809873-a128495da465"),  # Relaxing scalp massage and hair rinse
    _unsplash("photo-1616394584738-fc6e612e71b9"),  # Salon mirror styling station with ring light
    _unsplash("photo-1596462502278-27bfdc403348"),  # Professional salon hair products and serums
    _unsplash("photo-1522338140262-f46f5913618a"),  # Hair color application brush and bowl
    _unsplash("photo-1559599101-f38222814cf9"),  # Modern hair studio cutting session
    _unsplash("photo-1621605815971-fbc98d665033"),  # Barbershop razor shave and lineup
    _unsplash("photo-1616401784845-180882ba9ba8"),  # Salon styling chair with wooden interior
    _unsplash("photo-1544161515-4ab6ce6db874"),  # Relaxation head and scalp massage therapy
    _unsplash("photo-1604654894610-df63bc536371"),  # Salon manicure and nail care station
    _unsplash("photo-1519014816548-bf5fe059798b"),  # Clean aesthetic nail art station
    _unsplash("photo-1632345031435-8727f6897d53"),  # Professional nail styling
    _unsplash("photo-1512290923902-8a9f81dc236c"),  # Aesthetic facial spa treatment
    _unsplash("photo-1571019614242-c5c5dee9f50b"),  # Facial massage therapy
    _unsplash("photo-1487412720507-e7ab37603c6f"),  # Natural makeup application
    _unsplash("photo-1487412947147-5d3dc0db4c78"),  # Salon beauty makeup finish
    _unsplash("photo-1515377905703-c4788e51af15"),  # Lashes and brows lash extension application
    _unsplash("photo-1526510747491-63f999d4626b"),  # Barbershop edge lineup
]
