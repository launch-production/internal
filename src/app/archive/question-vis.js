import { useEffect, useState } from 'react';
import embed from 'vega-embed';


const QuestionVis = (question) => {

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    
      }, [])

    if (isClient) {
    // let mark_spec = vl.markPoint()
    //   .data(data)
    //   .toSpec()
    let mark_spec = require("./rules/I1/I1-14-0.json");
    embed('#vis', mark_spec, {"actions": false});
    }

    return (
        <div>
            <div id='visContainer'>
                <div id="vis"></div>
            </div>
        </div>
        
        
    );
  };
  
  export default QuestionVis;