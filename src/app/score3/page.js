import GenerateSet from '../GenerateSet';

export default function Page() {
    // const router = useRouter()
    var item_bank = require("../item_bank_pilot.json");
    console.log(item_bank)

    var generated_set = require("../autograded_Q1.json"); // last 88
    // var generated_set = require("../need_manual_grading.json")
    // var generated_set = require("../score_3.json")
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

    var combos_list = [[1, 2, 3], [1, 2, 4], [1, 2, 5], [1, 2, 6], [1, 3, 4], [1, 3, 5], [1, 3, 6], [1, 4, 5], [1, 4, 6], [1, 5, 6], [2, 3, 4], [2, 3, 5], [2, 3, 6], [2, 4, 5], [2, 4, 6], [2, 5, 6], [3, 4, 5], [3, 4, 6], [3, 5, 6], [4, 5, 6]]
    
    // var combos_list = [(1, 2, 3), (1, 2, 4), (1, 2, 5), (1, 2, 6), (1, 3, 4), (1, 3, 5), (1, 3, 6), (1, 4, 5), (1, 4, 6), (1, 5, 6), (2, 3, 4), (2, 3, 5), (2, 3, 6), (2, 4, 5), (2, 4, 6), (2, 5, 6), (3, 4, 5), (3, 4, 6), (3, 5, 6), (4, 5, 6)]
    return (
        <div>
        <GenerateSet 
            item={1} 
            item_bank={item_bank}
            generated_set={generated_set}
            combos_list={combos_list}
            score={3}
            pilot_answers={pilot_answers}
            tile_sets={tile_sets}
            constraints={constraints}
            assessment={true}
            mode={"item"}
            />
    </div>
    )
  }