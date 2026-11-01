"""Isolated tests for Theaetetus TEI scanner."""
import unittest
from research.theaetetus_name_scan import scan

def fixture():
    return ('''<TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader><title>Πρωταγόρας</title></teiHeader>
    <text><body><div><p>
    <milestone unit="section" n="152e"/>Παρμενίδου καὶ Ἐμπεδοκλῆς
    Ἐπίχαρμος Ὅμηρος <note>Πρωταγόρας</note>
    <milestone unit="section" n="180e"/>Μέλισσοί τε καὶ Παρμενίδαι
    καὶ μέλισσον Ἡρακλειτείων Πρωταγόρειον
    <milestone unit="section" n="207a"/>Ἡσίοδος Ὁμηρείων Θαλῆν
    </p></div></body></text></TEI>''').encode("utf-8")

class TheaetetusScannerTest(unittest.TestCase):
    def test_lexicon_and_exclusions(self):
        report=scan(fixture())
        self.assertEqual(report["total_name_occurrences"], 7)
        self.assertEqual(report["distinct_mentioned_sections"], 3)
        self.assertEqual(report["unclassified_capitalized_tokens"], [])
        self.assertEqual([m["id"] for m in report["mentions"]],
            ["parmenides", "empedocles", "epicharmus", "homer",
             "melissus", "hesiod", "thales"])
        self.assertFalse(any(m["token"] == "μέλισσον" for m in report["mentions"]))
        self.assertFalse(any(m["token"] == "Παρμενίδαι" for m in report["mentions"]))

if __name__ == "__main__":
    unittest.main()
