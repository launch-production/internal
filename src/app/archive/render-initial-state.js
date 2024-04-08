const RenderInitialTIles = (current_state, current_encoding) => {
    console.log(current_state)
    console.log(current_encoding)
    
    return (
        <div>
            {Object.entries(current_state).map((data_mapping, index) => (
                (data_mapping[0] == current_encoding[0] && data_mapping[1]["data"]) ? 
                <div key={"fill-data-"+index} className="dataTiles" id={"data-"+data_mapping[1]["data"]}><p>{data_mapping[1]["data"]}</p></div>
                : null
            ))}
        </div>
        
    );
  };
  
  export default RenderInitialTIles;