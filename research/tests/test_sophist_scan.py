"""Reusable Greek scanner: same parsing, different dialogue configuration."""
import unittest
from research.sophist_name_scan import scan
from research.greek_name_scan import greek_sections

def fixture():
    return ('''<TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader><title>Ξενοφάνους is not a passage</title></teiHeader>
    <text><body><div><p>
    <milestone unit="section" n="216a"/>Παρμενίδην καὶ Ζήνωνα Ὁμήρου
    <note>Ζήνωνα</note>
    <milestone unit="section" n="imbedded dialogue"/>
    <milestone unit="section" n="232d"/>Πρωταγόρειά
    <milestone unit="section" n="242d"/>Ξενοφάνους Ἰάδες Σικελαί Μοῦσαι
    <milestone unit="section" n="252c"/>Εὐρυκλέα
    </p></div></body></text></TEI>''').encode("utf-8")

class GenericNameScanTest(unittest.TestCase):
    def test_stephanus_and_intellectual_name_detection(self):
        report=scan(fixture())
        self.assertEqual(report["sections_scanned"],4)
        self.assertEqual(report["total_name_occurrences"],4)
        self.assertEqual(report["distinct_mentioned_sections"],2)
        self.assertEqual(report["unclassified_capitalized_tokens"],[])
        self.assertEqual([m["id"] for m in report["mentions"]],
                         ["parmenides","zeno","homer","xenophanes"])
        self.assertTrue(all(m["locus"] in {"216a","242d"} for m in report["mentions"]))

    def test_reject_duplicate_stef_locations(self):
        xml=fixture().replace(b'n="232d"',b'n="216a"')
        with self.assertRaisesRegex(ValueError,"Duplicate Stephanus"):
            greek_sections(xml)

if __name__ == "__main__":
    unittest.main()
