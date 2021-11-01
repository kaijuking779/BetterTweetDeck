import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import {table} from 'pronouns';

const cleanedTable = table.filter((l) => l[0] !== 'e');

interface EnglishMorphemes {
  pronoun_subject: string;
  pronoun_object: string;
  possessive_determiner: string;
  possessive_pronoun: string;
  reflexive: string;
}

async function getPronounsFromApi() {
  const res = await (await axios.get(`https://en.pronouns.page/api/pronouns`)).data;
  const values = Object.values(res as ReadonlyArray<{morphemes: EnglishMorphemes}>);

  return values
    .map((v) => {
      return v.morphemes;
    })
    .map((v) => {
      return [v.pronoun_subject, v.pronoun_object, v.possessive_determiner];
    })
    .filter((v) => v.every((p) => !p.includes('/')))
    .filter((v) => v[0] !== 'e');
}

(async () => {
  const englishMorphemes = await getPronounsFromApi();

  const totalMorphemes = englishMorphemes.concat(
    cleanedTable
      .map((l) => [l[0], l[1], l[2]])
      .filter((l) => {
        const slug = l.join('|');

        return englishMorphemes.every((ml) => ml.join('|') !== slug);
      })
  );

  await fs.writeFile(
    path.resolve(__dirname, '../src', 'assets', 'pronouns.json'),
    JSON.stringify({
      comment: 'This file is automatically generated',
      table: totalMorphemes,
    })
  );
})();
