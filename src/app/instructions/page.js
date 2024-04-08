import FinalInstructions from '../FinalInstructions';

export default function Page() {
    // const router = useRouter()
    var training_set = require("../training_set.json");
    console.log(training_set)

    var tile_sets = require("../tile_sets.json");
    console.log(tile_sets)

    var constraints = require("../constraints.json");
    console.log(constraints)
    return (
        <div>
        <FinalInstructions 
            item={100} 
            training_set={training_set}
            tile_sets={tile_sets}
            constraints={constraints}
            />
    </div>
    )
  }