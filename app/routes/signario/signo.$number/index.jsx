import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useRef, useEffect } from "react";

import { getSign } from "../../../db.server.js"; 
import markdown, { markdownInline } from "../../../markdown.server.js";

export function meta ({ data }) {
    return { title: "Signario | "+data?.gloss }
}

export async function loader ({ params }) {
    const sign = await getSign(params.number);
    if (!sign) throw new Response("", { status: 404 });

    if (sign.definitions.length === 0) {
        sign.acepciones = { note: null, groups: [], gloss: sign.gloss };
    } else {
        const contents = sign.definitions.map(d => d.content);
        let note = null;
        let start = 0;

        if (contents[0].startsWith('!')) {
            note = markdown(contents[0].slice(1).trim());
            start = 1;
        }

        const remaining = contents.slice(start);
        const hasSeparators = remaining.some(c => c.trim() === '---');

        let groups;
        if (hasSeparators) {
            groups = [];
            let currentGroup = [];
            for (const c of remaining) {
                if (c.trim() === '---') {
                    if (currentGroup.length > 0) groups.push(currentGroup);
                    currentGroup = [];
                } else {
                    currentGroup.push(markdownInline(c));
                }
            }
            if (currentGroup.length > 0) groups.push(currentGroup);
        } else {
            groups = remaining.length > 0
                ? [remaining.filter(c => c.trim() !== '---').map(c => markdownInline(c))]
                : [];
        }

        sign.acepciones = { note, groups, gloss: null };
    }

    return json(sign);
}

export default function Signo () {
    const s = useLoaderData();
    const bottom = useRef();
    useEffect(() => {
        bottom.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const { note, groups, gloss } = s.acepciones;
    const hasRomanGroups = groups.length > 1;

    return <div className="bg-stone-50">
        <h2 className="text-2xl text-center text-orange-700 my-4 py-2 border-b border-orange-700 font-bold">{s.notation}</h2>
        <video className="rounded w-full aspect-[4/3]" muted autoPlay controls>
          <source src={`/signario/signo/${s.number}/video.mp4`} />
        </video>
        <div className="prose lg:prose-xl prose-stone prose-orange my-2 mt-12">
            {gloss && <p>{gloss}</p>}
            {note && <div dangerouslySetInnerHTML={{__html: note}} />}
            {hasRomanGroups ? (
                <ol className="list-[upper-roman]">
                    {groups.map((group, gi) => (
                        <li key={gi}>
                            <ol className="list-decimal">
                                {group.map((def, di) => (
                                    <li key={di} dangerouslySetInnerHTML={{__html: def}} />
                                ))}
                            </ol>
                        </li>
                    ))}
                </ol>
            ) : groups.length > 0 && (
                <ol>
                    {groups[0].map((def, di) => (
                        <li key={di} dangerouslySetInnerHTML={{__html: def}} />
                    ))}
                </ol>
            )}
        </div>
        <div ref={bottom} className="mt-8" />
    </div>;
}
