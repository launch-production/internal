import GenerateSet from '../GenerateSet';

export default function Page() {
    // const router = useRouter()
    var item_bank = require("../item_bank_pilot.json");
    console.log(item_bank)

    var generated_set = require("../autograded_Q1.json"); 
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

    var combos_list = [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11], [7, 8], [7, 9], [7, 10], [7, 11], [8, 9], [8, 10], [8, 11], [9, 10], [9, 11], [10, 11]]
    
    
    return (
        <div>
        <GenerateSet 
            item={1} 
            item_bank={item_bank}
            generated_set={generated_set}
            combos_list={combos_list}
            score={2}
            pilot_answers={pilot_answers}
            tile_sets={tile_sets}
            constraints={constraints}
            assessment={true}
            mode={"item"}
            />
    </div>
    )
  }