import ItemComponent from './ItemComponent';
import { useRouter } from 'next/router'

const Q1 = () => {
    const router = useRouter()
    var item_bank = require("./item_bank.json");
    console.log(item_bank)
    return (
        <div>
            <ItemComponent 
                item={1} 
                item_bank={item_bank}
                />
        </div>
        
        
    );
  };
  
  export default Q1;