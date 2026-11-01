"""Checks for exact-form matching, false positives, corpus validation."""
import json
import tempfile
import unittest
from pathlib import Path
from research.scan_master import scan_corpus, build_lexicon

ROSTER=json.loads(Path("research/master_roster.json").read_text(encoding="utf-8"))
CORPUS=json.loads(Path("research/corpus_26.json").read_text(encoding="utf-8"))

def xml(content):
    return ('<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>'+
            '<div><p><milestone unit="section" n="152e"/>'+
            content+'</p></div></body></text></TEI>').encode("utf-8")

class CorpusMasterScanTest(unittest.TestCase):
    def test_one_roster_and_no_conflicting_forms(self):
        plain,sensitive=build_lexicon(ROSTER)
        self.assertEqual(len(ROSTER["people"]),31)
        self.assertIn("παρμενιδησ",plain)
        self.assertIn("ἀγάθων".casefold(),sensitive)
        self.assertNotIn("ἀγαθῶν".casefold(),sensitive)
        self.assertFalse(any(w["title"]=="Laws" for w in CORPUS["works"]))
        self.assertEqual(CORPUS["works"][-1]["title"],"Critias")
        self.assertEqual(len(CORPUS["works"]),26)

    def test_lexicon_only_matches_name_forms(self):
        # Here a tiny corpus replaces the 26-text inventory only to check
        # the matching engine; use the real corpus for the deployment gate.
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)
            (path/"tlg006.xml").write_bytes(xml(
                "Παρμενίδης Ἡράκλειτος Πρωταγόρειον Ἡρακλειτείων "
                "Παρμενίδαι Ἀγάθων Ἀγαθῶν ἀγαθῶν Μέλισσοί Μέλισσος"))
            c={"pinned_commit":CORPUS["pinned_commit"],
               "scope":CORPUS["scope"],
               "works":[dict(order=i+1,title=("Critias" if i==25 else "Test"+str(i)),
                             tlg="tlg006",edition="perseus-grc2") for i in range(26)]}
            # The same XML is used under 26 unique fake dialogue titles.
            report=scan_corpus(c,ROSTER,path)
            self.assertEqual(report["works_scanned"],26)
            self.assertEqual(report["name_occurrences"],26*4)
            self.assertEqual(report["matched_sections"],26*4)
            self.assertEqual(report["people_with_hits"],4)
            self.assertFalse(any(m["person_id"]=="protagoras" for m in report["matches"]))
            self.assertFalse(any(m["person_id"]=="melissus" and
                                 "Μέλισσοί" in m["tokens"] for m in report["matches"]))

if __name__=="__main__":
    unittest.main()
