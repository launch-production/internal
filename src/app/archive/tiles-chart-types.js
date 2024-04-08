import { useEffect, useState } from 'react';


function randomize_display(input_list) {
    for (let i = input_list.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [input_list[i], input_list[j]] = [input_list[j], input_list[i]]; 
      } 
      return input_list; 
  }

const TilesChartTypes = (charts_json) => {
    // const [shuffle, setShuffle] = useState(false);

    // useEffect(() => {
    //     if (!shuffle) {
    //         let randomized_types = randomize_display(types_list)
    //         console.log(randomized_types)
    //         setShuffle(true);
    //     }
    //   }, [])
    
    // if (isClient) {
    // // let mark_spec = vl.markPoint()
    // //   .data(data)
    // //   .toSpec()
    // let chart_types = require("./tiles/chart-types.json");
    // console.log(chart_types)
    // }
    let chart_types = require("./tiles/chart-types.json");
    let types_list = chart_types.charts_index;
    let tile_types = chart_types.types
    console.log(tile_types)
    
    return (
        <div>
            <div id='chartTypes'>
              <p>Chart Types</p>
              <div>
                {types_list.map(chart_tiles => (
                    <div key={chart_tiles}>
                        <img src={tile_types[chart_tiles]}></img>
                    </div>
                ))}
              </div>
            </div>
        </div>
        
    );
  };
  
  export default TilesChartTypes;