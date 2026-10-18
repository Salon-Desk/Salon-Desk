"""Constants for voice agent worker."""

import re

# Transcript validation
_NOISE_RE = re.compile(r"^(.)\1{6,}$")

# Farewell messages
_FAREWELL_EN = "Goodbye! Thank you for choosing SalonDesk. Have a wonderful day!"
_FAREWELL_AM = "ደህና ሁኑ! SalonDesk ስለተጠቀሙ እናመሰግናለን። መልካም ቀን ይሁንልዎ!"

# Location query keywords
_LOCATION_QUERY_KEYWORDS = (
    "near me",
    "nearby",
    "closest",
    "where am i",
    "my location",
    "nearest",
    "around me",
    "close by",
)
