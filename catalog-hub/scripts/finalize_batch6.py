#!/usr/bin/env python3
import json
import re
import sys
from collections import OrderedDict

SRC = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/data/sarah-pos-batch6-meta.json"
GEN = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/gen_batch6.py"
OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6-meta-defs.json"
LATIN = re.compile(r"[a-zA-Z]")

ORDER = [
    "3337871324599", "773602710683", "3606000537699", "850045076085", "689304348423",
    "072140020491", "3337875722827", "3337875597395", "381371020652", "3760294351178",
    "3606000534919", "8011003872077", "614514410103", "689304188890", "7640111502791",
    "8057971188727", "3614228899376", "3616303048181", "3337875583626", "8018365500037",
    "3614228954051", "8011003858552", "3700550216094", "3337875597357", "3274872448780",
    "3355992004596", "3760294350881", "3614274017069", "8809913830641", "681619815997",
    "3346130018926", "8809576261868", "3614274217155", "3614274217148", "855732733210",
    "5060150185168", "8809875906477", "3349668614523", "3700134403957", "602004146151",
    "072140634827", "888066024082", "088300162543", "783320411168", "3386460126014",
    "8681008055258", "607845070085", "8681008055074", "8683608070617", "8683608070594",
]


def ar(text: str) -> str:
    if LATIN.search(text):
        raise ValueError(f"Latin in Arabic text: {text[:80]}")
    return text


# introAr overrides for entries whose generated copy mixed Latin letters
INTRO_AR = {
    "7640111502791": ar("إنكر نوار إكستريم من lalique يعmّq nafحات al-fitiver al-asطoria bi-akhshab dakina wa lamsa madhkana li hudhur rajali qawi."),
}
