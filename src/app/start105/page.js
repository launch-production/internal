import ConstructionItemComponent from '../ConstructionItemComponent';

export default function Page() {
    // const router = useRouter()
    var item_bank = require("../item_bank.json");
    console.log(item_bank)

    var tile_sets = require("../tile_sets.json");
    console.log(tile_sets)

    var constraints = require("../constraints.json");
    console.log(constraints)
    return (
        <div>
        <ConstructionItemComponent 
            item={5} 
            item_bank={item_bank}
            tile_sets={tile_sets}
            constraints={constraints}
            assessment={false}
            mode={"training"}
            />
    </div>
    )
  }