"""Fixture tests for the Meno scanner; no copyrighted passage reproduced."""
import unittest
from research.meno_name_scan import scan, compare

FAKE_TEI = b'''<TEI xmlns="http://www.tei-c.org/ns/1.0">
<teiHeader><title>Gorgias is metadata, not text</title></teiHeader>
<text><body><div><p><said who="#\\xce\\x93\\xce\\xbf\\xcf\\x81\\xce\\xb3\\xce\\xaf\\xce\\xb1\\xcf\\x82">
<label>\\xce\\x9c\\xce\\x95\\xce\\x9d.</label><milestone unit="section" n="76c"/>Gorgias
<note>Gorgias and Homer in critical apparatus</note>
</said></p></div></body></text></TEI>'''

def synthetic_xml():
    # Deliberate Greek inflections and exclusion of literal editor's notes.
    return ('''<TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader><title>Πίνδαρος</title></teiHeader>
    <text><body><div>
    <p><label>Γοργίας</label><milestone unit="section" n="70a"/>
    Ἐμπεδοκλέα καὶ Πρόδικος. <note>Πίνδαρος</note></p>
    <p><milestone n="70b" unit="section"/> Γοργίαν καὶ Γοργίας.
    <label>Ὅμηρος</label> Πρωταγόραν. Σώκρατες.</p>
    </div></body></text></TEI>''').encode("utf-8")

class ScannerTest(unittest.TestCase):
    def test_sections_spelling_and_notes(self):
        result = scan(synthetic_xml())
        self.assertEqual(result["sections_scanned"], 2)
        self.assertEqual(result["total_name_occurrences"], 5)
        self.assertEqual([m["id"] for m in result["mentions"]],
                         ["empedocles", "prodicus", "gorgias", "gorgias", "protagoras"])
        self.assertEqual(result["unclassified_capitalized_tokens"], [])
        self.assertEqual(result["distinct_mentioned_sections"], 2)

    def test_expected_comparison_detects_change(self):
        report = scan(synthetic_xml())
        expected = {
            "sections_scanned": 2, "first_section": "70a", "last_section": "70b",
            "total_name_occurrences": 5, "distinct_mentioned_sections": 2,
            "identities": {x["id"]: {"occurrences": x["occurrences"],
                                      "sections": x["sections"]}
                           for x in report["intellectual_identities"]}
        }
        self.assertEqual(compare(report, expected), [])
        expected["total_name_occurrences"] = 6
        self.assertTrue(compare(report, expected))

if __name__ == "__main__":
    unittest.main()
