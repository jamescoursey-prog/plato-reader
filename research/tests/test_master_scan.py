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
        self.assertIn("θαλεω",plain)  # Θάλεώ in Republic 600a
        self.assertEqual(next(p for p in ROSTER["people"] if p["id"]=="euthydemus")["review_flag"],
                         "identity_and_historicity_debated")
        self.assertEqual(next(p for p in ROSTER["people"] if p["id"]=="dionysodorus")["review_flag"],
                         "historicity_debated")

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


    def test_research_identity_exclusions_and_lowercase_name_exceptions(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)
            fixture={
              "Laches":("197d","προδίκῳ"),
              "Theaetetus":("151b","προδίκῳ"),
              "Republic":("328b","Εὐθύδημος"),
              "Symposium":("222b","Εὐθύδημος"),
              "Cratylus":("386d","Εὐθύδημον"),
            }
            w=[]
            for i in range(26):
                title = list(fixture)[i] if i<5 else ("Critias" if i==25 else "Test"+str(i))
                locus,word=fixture.get(title,("152e","Ἀγαθῶν ἀγαθῶν Ἡρακλειτείων"))
                tlg="tlg"+str(i+1).zfill(3)
                w.append({"order":i+1,"title":title,"tlg":tlg,"edition":"perseus-grc2"})
                body=f'<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body><p><milestone unit="section" n="{locus}"/>{word}</p></body></text></TEI>'
                (path/(tlg+".xml")).write_bytes(body.encode("utf-8"))
            corpus={"pinned_commit":CORPUS["pinned_commit"],"scope":CORPUS["scope"],"works":w}
            report=scan_corpus(corpus,ROSTER,path)
            self.assertEqual(len(report["identity_exclusions"]),2)
            self.assertEqual(len(report["lowercase_name_exceptions"]),2)
            by={(m["person_id"],m["work"],m["section"]) for m in report["matches"]}
            self.assertIn(("prodicus","Laches","197d"),by)
            self.assertIn(("prodicus","Theaetetus","151b"),by)
            self.assertIn(("euthydemus","Cratylus","386d"),by)
            self.assertNotIn(("euthydemus","Republic","328b"),by)
            self.assertNotIn(("euthydemus","Symposium","222b"),by)

if __name__=="__main__":
    unittest.main()
