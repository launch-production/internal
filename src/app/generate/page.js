import GenerateSet from '../GenerateSet';

export default function Page() {
    // const router = useRouter()
    var item_bank = require("../item_bank_pilot.json");
    console.log(item_bank)

    // var generated_set = require("../autograded_Q2.json"); 
    // var generated_set = require("../need_manual_grading.json")
    var generated_set = require("../score_3.json")
    // var generated_set = require("../score_4.json")
    // var generated_set = require("../score_5.json")
    // var generated_set = require("../score_6.json")
    console.log(generated_set)

    var pilot_answers = require("../pilot_data.json");
    console.log(pilot_answers)

    var tile_sets = require("../tile_sets.json");
    console.log(tile_sets)

    var constraints = require("../constraints.json");
    console.log(constraints)
    
    
    return (
        <div>
        <GenerateSet 
            item={2} 
            item_bank={item_bank}
            generated_set={generated_set}
            combos_list={combos_list}
            score={0}
            pilot_answers={pilot_answers}
            tile_sets={tile_sets}
            constraints={constraints}
            assessment={true}
            mode={"item"}
            />
    </div>
    )
  }