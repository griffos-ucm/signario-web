import { useState, useEffect } from "react";
import { useObsReducer } from "./pregunton/common";
import { PreguntonQ } from "./pregunton/Q";
import { PreguntonO } from "./pregunton/O";
import { PreguntonL } from "./pregunton/L";
import { PreguntonE, PreguntonG, PreguntonD } from "./pregunton/dynams";

const DEFAULT_SN = {
    prefix: "",
    q: "", o: "", l: "", lfore: false,
    e: "", g: "", gfore: false, d: "",
    l2: "", h2: "", r: "",
}

function reducer (SN, action) {
    let ret;
    switch (action.action) {
        case "segment":
            ret = { ...SN, [action.segment]: action.value };
            break;
        case "lugar":
            const [lfore, l] = action.value;
            ret = { ...SN, lfore, l };
            break;
        case "giro":
            const {g, forearm: gfore} = action.value;
            ret = { ...SN, gfore, g };
            break;
        case "despl":
            const [d, l2] = action.value;
            ret = { ...SN, d, l2 };
            break;
        default:
            console.error("UNKNOWN ACTION", action, SN);
            return SN;
    }
    ret.prefix = ret.lfore || ret.gfore ? "_" : "";
    return ret;
}

export function Pregunton ({ setSN }) {
    const [detailed, setDets] = useState(false);

    useEffect(() => {
        const isAvanzado = document.cookie.split(';').some(c => c.trim() === 'avanzado=true');
        setDets(isAvanzado);
    }, []);

    function toggleDets () {
        const newVal = !detailed;
        document.cookie = `avanzado=${newVal}; path=/; max-age=31536000`;
        setDets(newVal);
    }

    const [SN, dispatch] = useObsReducer(DEFAULT_SN, reducer,
        sn => setSN(signotation(sn)));

    return <form className="Pregunton mt-4 mb-2">

        <h2>Mano principal</h2>
        <PreguntonQ detailed={detailed}
            setSN={value => dispatch({ action: "segment", segment: "q", value })} />
        {detailed?<PreguntonO setSN={value => dispatch({ action: "segment", segment: "o", value })} />:null}
        <PreguntonL detailed={detailed}
            setSN={value => dispatch({ action: "lugar", value })} />

        <h2>Dinamismos</h2>
        <PreguntonE setSN={value => dispatch({ action: "segment", segment: "e", value })} />
        <PreguntonG detailed={detailed}
            setSN={value => dispatch({ action: "giro", value })} />
        <PreguntonD detailed={detailed}
            setSN={value => dispatch({ action: "despl", value })} />

        <h2>Otros</h2>
        <PreguntonH2 setSN={value => dispatch({ action: "segment", segment: "h2", value })} />
        {detailed?<PreguntonR setSN={value => dispatch({ action: "segment", segment: "r", value })} />:null}

        <p className="text-right italic text-stone-600 mt-3">
            <label>Avanzado
            <input className="ml-2" type="checkbox"
                checked={detailed} onChange={toggleDets} />
        </label></p>
    </form>;
}

function signotation (SN) {
    return [SN.prefix+SN.q, SN.o, SN.l,
        SN.e, SN.g, SN.d,
        SN.l2, SN.h2, SN.r].filter(x => !!x).join(":");
}

function PreguntonH2 ({ setSN }) {
    const [h2, dispatch] = useObsReducer("", (_,x) => x, setSN);
    return <>
        <h3>¿La otra mano se mueve?</h3>
        <select value={h2} autoComplete="off"
            onChange={e => dispatch(e.target.value)}>
            <option value="">No</option>
            <option value="=">Sí, igual que la dominante</option>
            <option value="~">Sí, pero al contrario que la dominante</option>
            <option value="&">Sí, como una unidad junto a la dominante</option>
        </select>
    </>;
}

function PreguntonR ({ setSN }) {
    const [r, dispatch] = useObsReducer("", (_,x) => x, setSN);
    return <>
        <h3>¿Se repite el movimiento?</h3>
        <select value={r} autoComplete="off"
            onChange={e => dispatch(e.target.value)}>
            <option value="">No</option>
            <option value="R">Sí</option>
            <option value="N">Se deshace y rehace el movimiento</option>
        </select>
    </>;
}
