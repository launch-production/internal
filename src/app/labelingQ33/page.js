import AnswerLabeling from '../AnswerLabeling';

export default function Page() {
    // const router = useRouter()
    var item_bank = require("../item_bank_pilot.json");
    console.log(item_bank)

    var pilot_answers = require("../pilot_data.json");
    console.log(pilot_answers)

    var tile_sets = require("../tile_sets.json");
    console.log(tile_sets)

    var constraints = require("../constraints.json");
    console.log(constraints)
    return (
        <div>
        <AnswerLabeling 
            item={33} 
            item_bank={item_bank}
            pilot_answers={pilot_answers}
            tile_sets={tile_sets}
            constraints={constraints}
            assessment={true}
            mode={"item"}
            />
    </div>
    )
  }