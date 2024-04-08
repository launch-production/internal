'use client'
import { useEffect, useState } from 'react';
import embed from 'vega-embed';
import * as vl from 'vega-lite-api';
import { db } from './firebaseConfig';
import { doc, collection, addDoc, updateDoc, setDoc, serverTimestamp, getDocs} from "firebase/firestore";
import QuestionText from './question-text.js';
// import QuestionVis from './question-vis.js';
// import TilesChartTypes from './tiles-chart-types.js';
// import TilesEncodings from './tiles-encodings.js';
// import TilesMappings from './tiles-mappings.js';
// import TilesTransformations from './tiles-transformations.js';
// import { DraftModeProvider } from 'next/dist/server/async-storage/draft-mode-provider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

async function addDataToFireStore(prolificID, questionID, usability_answers, item_start, text_answer) {
    try {
      const docRef = await setDoc(doc(db, prolificID, questionID), {
        timestamp: serverTimestamp(),
        usability_answers: usability_answers,
        item_startTime: item_start,
        item_endTime: new Date().getTime(),
        text_answer: text_answer
      }, { merge: true });
      console.log("Doc written with ID: ", prolificID);
      return true;
    } catch (error) {
      console.error("Error ", error)
      return false;
    }
  }

  async function addProgress(prolificID, current_item) {
    try {
      const docRef = await setDoc(doc(db, prolificID, "progress"), {
        completed_item: current_item
      }, { merge: true });
      console.log("Doc written with ID: ", prolificID);
      return true;
    } catch (error) {
      console.error("Error ", error)
      return false;
    }
  }
  


async function initializeTime(prolificID, questionID, time_start) {
  try {
    const docRef = await setDoc(doc(db, prolificID, questionID), {
      timestamp_start: time_start
    }, { merge: true });
    console.log("Doc written with ID: ", prolificID);
    return true;
  } catch (error) {
    console.error("Error ", error)
    return false;
  }
}


function updateDataEncoding(vis_spec, encoding, var_update_to, data_columns) {
    console.log("in update data encoding for drop down")
    console.log(encoding)
    
    let update_to = var_update_to
    let split_var = var_update_to.split("-")
    if (split_var.length == 2 && var_update_to.split("-")[0] == "sum") {
        update_to = var_update_to.split("-")[1]
    }

    if (!vis_spec["encoding"][encoding]) {
        vis_spec["encoding"][encoding] = {}
    }
    
    if (var_update_to.includes("count")) {
        let actions = var_update_to.split("-")
        vis_spec["encoding"][encoding]["aggregate"] = "count";
        vis_spec["encoding"][encoding]["field"] = "";
        vis_spec["encoding"][encoding]["type"] = "";
        
        // count-bin-data
        if (actions.length == 3) {
            let bin_on = actions[1].split("_")[1]
            vis_spec["encoding"][bin_on]["bin"] = true;
            vis_spec["encoding"][bin_on]["aggregate"] = "" // bin means the other channel has aggregate, so remove any aggregate in this channel
            
        }
        if (vis_spec["encoding"][encoding]["sort"]) {
            // vis_spec["encoding"][encoding]["timeUnit"] = ""
            vis_spec["encoding"][encoding]["sort"] = ""
            
        }
        
    } else if (var_update_to.includes("sum")) {
        vis_spec["encoding"][encoding]["aggregate"] = "sum";
        if (update_to == "Month") {
        //   vis_spec["encoding"][encoding]["field"] = "Month";
        //   vis_spec["encoding"][encoding]["timeUnit"] = ""
          vis_spec["encoding"][encoding]["sort"] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
        } else {
          if (vis_spec["encoding"][encoding]["sort"]) {
                // vis_spec["encoding"][encoding]["timeUnit"] = ""
                vis_spec["encoding"][encoding]["sort"] = ""
          }
          
           
        }
         vis_spec["encoding"][encoding]["field"] = update_to 
        vis_spec["encoding"][encoding]["type"] = data_columns[update_to]["type"];
        
    } else {
        if (update_to == "Month") {
            // vis_spec["encoding"][encoding]["field"] = "Month";
            // vis_spec["encoding"][encoding]["timeUnit"] = "month"
            vis_spec["encoding"][encoding]["sort"] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
        } else {
            if (vis_spec["encoding"][encoding]["sort"]) {
                // vis_spec["encoding"][encoding]["timeUnit"] = ""
                vis_spec["encoding"][encoding]["sort"] = ""
            }
            
            
        }
        vis_spec["encoding"][encoding]["field"] = update_to
        vis_spec["encoding"][encoding]["type"] = data_columns[update_to]["type"];
    }
    if (encoding == "color") {
        let color_scheme = data_columns[update_to]["color"]
        if (color_scheme == "div") {
            vis_spec["encoding"]["color"]["scale"] = {"scheme": "purpleorange"};
        } else if (color_scheme == "seq") {
            vis_spec["encoding"]["color"]["scale"] = {"scheme": "purplebluegreen"};
        } else if (color_scheme == "qual") {
            vis_spec["encoding"]["color"]["scale"] = {"scheme": "dark2"};
        }
    }

    embed('#questionVis', vis_spec, {"actions": false});
    return vis_spec
    
}

function removeDataEncoding(vis_spec, encoding) {
  console.log("in remove data encoding")
  console.log(vis_spec)
  console.log(encoding)
//   console.log(remove_data)
  // console.log(mapping_state)
  vis_spec["encoding"][encoding]["field"] = "";
  vis_spec["encoding"][encoding]["type"] = "";
  if (vis_spec["encoding"][encoding]["sort"]) {
    // vis_spec["encoding"][encoding]["timeUnit"] = ""
    vis_spec["encoding"][encoding]["sort"] = ""
  }
//   if (encoding.includes("color")) {
//     console.log(encoding);
//     vis_spec["encoding"]["color"]["field"] = "";
//     vis_spec["encoding"]["color"]["type"] = "";
//   } else {
//     vis_spec["encoding"][encoding]["field"] = "";
//     vis_spec["encoding"][encoding]["type"] = "";
//   }

//   document.getElementById("questionAnswer").focus()
  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}

function removeAction(vis_spec, encoding, action) {
    console.log("in remove data encoding")
    console.log(vis_spec)
    console.log(encoding)
  //   console.log(remove_data)
    // console.log(mapping_state)
    if  (action == "count" || action == "sum") {
        if (vis_spec["encoding"][encoding]["aggregate"]) {
            vis_spec["encoding"][encoding]["aggregate"] = ""; 
        }
       
    } else if (action == "bin") {
      if (vis_spec["encoding"][encoding]["bin"]) {
        vis_spec["encoding"][encoding]["bin"] = false;  
      }
      
    }
    
  //   if (encoding.includes("color")) {
  //     console.log(encoding);
  //     vis_spec["encoding"]["color"]["field"] = "";
  //     vis_spec["encoding"]["color"]["type"] = "";
  //   } else {
  //     vis_spec["encoding"][encoding]["field"] = "";
  //     vis_spec["encoding"][encoding]["type"] = "";
  //   }
  
  //   document.getElementById("questionAnswer").focus()
    embed('#questionVis', vis_spec, {"actions": false});
    return vis_spec
  }


function updateMark(vis_spec, mark) {
  console.log("in update mark")
  console.log(vis_spec, mark)
  vis_spec["mark"]["type"] = mark;
//   document.getElementById("questionAnswer").focus()
  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}



function clearVis(vis_spec) {
    vis_spec["encoding"] = {}
    embed('#questionVis', vis_spec, {"actions": false});
    return vis_spec
}

const UsabilityCheck = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false);
  // const [PID, setPID] = useState("")
  const [score, setScore] = useState("") 
  const [chartTypeSelected, setChartTypeSelected] = useState("");
  const [encodingsDisplay, setEncodingDisplay] = useState({});
  const [draggedTile, setDraggedTile] = useState(null);
  const [currentItem, setCurrentItem] = useState(props.mode+props.item);
  const [itemBank, SetItemBank] = useState(props.item_bank);
  const [tileSets, setTileSets] = useState(props.tile_sets);
  const [constraints, setConstraints] = useState(props.constraints);
  const [currentChartType, setCurrentChartType] = useState("bar");
  const [selectedChart, setSelectedChart] = useState(false);
  const [selectedVar, setSelectedVar] = useState(false);
  const [dataset, setDataset] = useState(props.item_bank["datasets"][props.item_bank[props.mode+props.item]["dataset"]]);
  const [loadVis, setLoadVis] = useState(props.item_bank[props.mode+props.item]["question_vis"]);
  const [currentItemState, setCurrentItemState] = useState(props.item_bank[props.mode+props.item]["manage_state"]);
  const [initializeState, setInitializeState] = useState(props.item_bank[props.mode+props.item]["initialize"]);
  const [bankStatus, setBankStatus] = useState({});
  const [noTransformationDisplay, setNoTransformationDisplay] = useState([]);
  const [pID, setPID] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [showTextBox, setShowTextBox] = useState(false);
  const [sumOptionsAddedY, setSumOptionsAddedY] = useState(false);
  const [sumOptionsAddedX, setSumOptionsAddedX] = useState(false);
  const [itemAnswer, setItemAnswer] = useState("no answer");
  const [usabilityItemAnswers, setUsabilityItemAnswers] = useState({"q0": 0, "q1": 0, "q2": 0, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0, "q9": 0 })
  const [currentProgress, setCurrentProgress] = useState({})
  const [redirectTo, setRedirectTo] = useState("")
  const [loading, setLoading] = useState(true);
  
  console.log("in CREATE item component!")
  console.log(props)
  console.log(props.item_bank)
  console.log(pathname)
  console.log(searchParams)
  const handleSubmit = async (e, questionID, item_start, text_answer) => {
    e.preventDefault();
    console.log("in handle submit!!")
    console.log(pID)
    console.log(itemBank[currentItem]["question_meta_data"]["question_text"])
    console.log(loadVis)
    // const queryString = window.location.search;
    // console.log(queryString);

    // const urlParams = new URLSearchParams(queryString);
    // console.log(urlParams)

    // const prolific_ID = urlParams.get('PROLIFIC_PID')
    // console.log(prolific_ID)

    if (pID) {
    //   if (questionID.split("_")[1] == 1) {
    //     const add_time_start = await initializeTime(pID, questionID, time_start)
    //     if (!add_time_start) {
    //       // setPID("");
    //       setScore("");
    //       alert("An error occurred. Please contact the survey administrator.");
    //     }
    //   }
      const added = await addDataToFireStore(pID, questionID, usabilityItemAnswers, item_start, text_answer);
      if (!added) {
        // setPID("");
        setScore("");
        alert("An error occurred. Please contact the survey administrator.");
      } else {
        let url_pid = "?PROLIFIC_PID=" + pID;
        // let next_item = props.item + 1
        router.push('/instructions'+url_pid)

        
      }
    }
    
  };

  const getProgress = async (prolificID) => {
    try {
      const querySnapshot = await getDocs(collection(db, prolificID));
      var progress = {}
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        if (doc.id == "progress") {
          progress = doc.data();
        }
        console.log(doc.id, " => ", doc.data());
      });
      // const docRef = await setDoc(doc(db, prolificID, questionID), {
      //   timestamp: serverTimestamp(),
      //   item_startTime: item_start,
      //   consent: "Agree",
      //   prolificID: prolificID,
      //   item_endTime: new Date().getTime(),
      //   randomized_order: randomized_order
      // }, { merge: true });
      // console.log("Doc written with ID: ", prolificID);
    //   return progress;
        console.log(progress)
      setCurrentProgress(progress)
      console.log(currentProgress)
      return progress
    } catch (error) {
      console.error("Error ", error)
      return false;
    }
  }

  const checkProgress = async (prolific_ID) => {
    console.log("checking progress?")
    console.log(prolific_ID)
    if (prolific_ID) {
      const current_progress = await getProgress(prolific_ID);
      if (!current_progress) {
        // setPID("");
        setScore("");
        alert("An error occurred. Please contact the survey administrator.");
        return false
      } else {
        // let url_pid = "?PROLIFIC_PID=" + pID;
        // let next_item = props.item + 1
        
        // router.push('/training'+url_pid)
        console.log(current_progress)
        setLoading(false)
        // setCurrentProgress(current_progress)
        // return true
        console.log()
        if (current_progress["completed_item"]) {
            if (current_progress["completed_item"] == "consent") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/training" + url_pid
                if (window.location.href.includes("training")) {
                    setRedirectTo("")
                } else {
                    setRedirectTo(redirect_url)
                }
                // router.push('/'+url_pid)
                // return true
            } else if (current_progress["completed_item"] == "training") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/start101" + url_pid
                // setRedirectTo("")
                if (window.location.href.includes("start101")) {
                    setRedirectTo("")
                } else {
                    setRedirectTo(redirect_url)
                }

                // setRedirectTo(redirect_url)
            } else if (current_progress["completed_item"] == "instructions") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/Q1" + url_pid
                if (window.location.href.includes("Q1")) {
                    setRedirectTo("")
                } else {
                    setRedirectTo(redirect_url)
                }
            } else if (current_progress["completed_item"] == "training6") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/instructions" + url_pid
                if (window.location.href.includes("instructions")) {
                    setRedirectTo("")
                } else {
                    setRedirectTo(redirect_url)
                }
            } else {
                let current_item_info = current_progress["completed_item"].split("_")
                let display_item = Number(current_item_info[1]) + 1
                let type = current_item_info[0]
                if (type == "training") {
                    let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                    let check_existing = "start10" + display_item;
                    let redirect_url = "/start10" + display_item + url_pid
                    if (window.location.href.includes(check_existing)) {
                        setRedirectTo("")
                    } else {
                        setRedirectTo(redirect_url)
                    }

                } else if (type == "item") {
                    if (display_item == 42) {
                    location.href = "https://app.prolific.com/submissions/complete?cc=C17SX24M";
                    } else {
                        let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                        let check_existing = "Q" + display_item;
                        let redirect_url = "/Q" + display_item + url_pid
                        if (window.location.href.includes(check_existing)) {
                            setRedirectTo("")
                        } else {
                            setRedirectTo(redirect_url)
                        }
                    }
                }
                
                
            }
        } else {
            let url_pid = "?PROLIFIC_PID=" + prolific_ID;
            let redirect_url = url_pid
            setRedirectTo(redirect_url)
        }
        
        


        // if (current_progress["completed_item"]) {
        //   if (current_progress["completed_item"] == "consent") {
        //     setPageVisited(true);
        //   }
        // }
        
      }
    }
  }

  const updateProgress = async (prolificID, completed_item) => {
    if (prolificID) {
      const added_progress = await addProgress(prolificID, completed_item);
      if (!added_progress) {
        // setPID("");
        setScore("");
        alert("An error occurred. Please contact the survey administrator.");
      }
    }
  }

  useEffect(() => {
      if (!isClient) {
        // if (props.item == 1) {
          let start_time = new Date().getTime()
          console.log("printing time!!")
          console.log(start_time)
          setStartTime(start_time)
        // }
      }

      
      const queryString = window.location.search;
      console.log(queryString);
  
      const urlParams = new URLSearchParams(queryString);
      console.log(urlParams)
  
      const prolific_ID = urlParams.get('PROLIFIC_PID')
      console.log(prolific_ID)
      setPID(prolific_ID);
      checkProgress(prolific_ID)

      setIsClient(true);
      
    }, [])

  if (isClient) {

    // console.log(loadVis)
    // let mark_spec = require(item_bank["item"+currentItem.toString()]["initialize"]["question_vis"]);
    // console.log(props.item_bank["training"+props.item]["model_vis"])
    // embed('#questionVis', loadVis, {"actions": false});
    // if (!props.assessment) {
    //     embed("#toReconstruct", props.item_bank["training"+props.item]["model_vis"], {"actions": false})
    // }
    
    // console.log(require(mark_spec))
  }

  

  let chart_types = Object.keys(tileSets)
  // let types_list = chart_types.charts_index;
  // let tile_types = chart_types.types
  console.log(chart_types)

//   let transformations = tileSets[currentChartType]["transformations"];
  let transformations = tileSets[currentChartType]["transformations"];
  // let actions_list = transformations.transformation_index;
  // let action_types = transformations.actions
  // console.log(action_types)

  let encodings = tileSets[currentChartType]["encodings"];
  console.log(encodings)
  // console.log(chartTypeSelected)
  // console.log(encodings[chartTypeSelected])

  let read_dataset = dataset;
  console.log(read_dataset)
  let data_columns = Object.keys(read_dataset)
  console.log(data_columns)
  
  const changeChartType = (clicked_chart) => {
    console.log("clicked")
    console.log(clicked_chart)
    console.log(selectedChart)
    // default for line and point are actual values, so remove sum on any quantative var
    let current_y_value = document.getElementById("data-y").value
    let current_x_value = document.getElementById("data-x").value
    if (clicked_chart == "line" || clicked_chart == "point") {
        if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
            removeAction(loadVis, "y", "sum")
        }
        if (dataset[current_x_value] && dataset[current_x_value]["type"] == "quantitative") {
            removeAction(loadVis, "x", "sum")
        }
    } else {
        if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
            if (!current_x_value.includes("count")) {
                updateDataEncoding(loadVis, "y", "sum-"+current_y_value, dataset)
            }
            
        }
        if (dataset[current_x_value] && dataset[current_x_value]["type"] == "quantitative") {
            if (!current_y_value.includes("count")) {
                updateDataEncoding(loadVis, "x", "sum-"+current_x_value, dataset)
            }
        }
    }
    let vis_update = loadVis
    // clear vis when changing chart type
    // if (selectedChart) {
    //     clearVis(vis_update)
    //     setCurrentItemState(props.item_bank["item"+props.item]["manage_state"]);
    //     setSelectedVar(false);
    //     document.getElementById("data-y").value = ""
    //     document.getElementById("data-x").value = ""
    //     document.getElementById("data-color").value = ""
    //     document.getElementById("data-size").value = ""
    // }
    console.log(loadVis)
    setChartTypeSelected(clicked_chart);
    setCurrentChartType(clicked_chart)
    let state_change = currentItemState
    state_change["chart_type"] = clicked_chart
    setCurrentItemState(state_change)
    // setEncodingDisplay(tileSets[clicked_chart]["encodings"]);
    
    updateMark(vis_update, clicked_chart)
    setSelectedChart(true);
    let chart_tiles = document.getElementsByClassName("chartTilesContainer")
    console.log(chart_tiles)
    for (let index = 0; index < chart_tiles.length; index += 1) {
      if (chart_tiles[index].classList.contains("selectedChart")) {
        chart_tiles[index].classList.remove("selectedChart");
      }
    }
    document.getElementById(clicked_chart+"_container").classList.add("selectedChart")
  }



  const removeOption = (vis_spec, check_element, to_remove, from_encoding) => {
    console.log("in remove options")
    console.log(to_remove)
    for (let i = 0; i < check_element.length; i += 1) {
        if (check_element.options[i].value.includes(to_remove)) {
            check_element.remove(i)
            removeAction(vis_spec, from_encoding, to_remove);
        }
    }
  }

  const addSumOf = (add_to, current_element, dataset) => {
    for (let i = 0; i < add_to.length; i += 1) {
        let variable = add_to.options[i].value
        if (dataset[variable] && dataset[variable]["type"] == "quantitative") {
            let add_sum_option = document.createElement("option")
            add_sum_option.value = "sum-" + variable
            add_sum_option.innerHTML = "Sum of " + variable
            add_to.appendChild(add_sum_option)
            // add_to.options[i].value = "sum-" + variable
            // add_to.options[i].innerHTML = "Sum of " + variable

        }
    }
  }

  const removeSumOf = (remove_from) => {
    for (let i = 0; i < remove_from.length; i += 1) {
        let variable = remove_from.options[i].value
        if (variable.includes("sum")) {
            remove_from.options[i].value = variable.split("-")[1]
            remove_from.options[i].innerHTML = variable.split("-")[1]
        }
    }

  }

  const updateYSelectedValue = () => {
    let select_y = document.getElementById("data-y").value
    console.log(select_y)
    console.log(dataset)
    let state_change = currentItemState
    if (!select_y) {
        removeDataEncoding(loadVis, "y")
        state_change["encodings"]["y"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        removeAction(loadVis, "y", "count");
        removeAction(loadVis, "y", "bin");
        removeAction(loadVis, "x", "bin");
        updateDataEncoding(loadVis, "y", select_y, dataset)
        let x_axis = document.getElementById("data-x")
        removeOption(loadVis, x_axis, "count", "x")
        let add_count_option = document.createElement("option")
        add_count_option.innerHTML = "Count of " + select_y
        if (dataset[select_y] && dataset[select_y]["type"] == "quantitative") {
            add_count_option.value = "count-bin_y-" + select_y
            removeAction(loadVis, "y", "sum")
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                updateDataEncoding(loadVis, "y", "sum-"+select_y, dataset)
            }
            // removeSumOf(x_axis) // remove sums from the other axis
            // removeDataEncoding(loadVis, "x")
         
            // setSumOptionsAddedX(false);
            
        } else if (dataset[select_y]) {
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                // if the current value on x axis is quantative and y value is not, set the x value to be sum again
                let current_x_value = document.getElementById("data-x").value
                if (dataset[current_x_value] && dataset[current_x_value]["type"] == "quantitative") {
                    updateDataEncoding(loadVis, "x", "sum-"+current_x_value, dataset)
                }
            
            }
            // if (!sumOptionsAddedX) {
                let current_axis = document.getElementById("data-y")
                // removeSumOf(current_axis) // remove sums from the current axis
                
                // addSumOf(x_axis, current_axis, dataset)
            //     setSumOptionsAddedX(true);
            // }
            add_count_option.value = "count-" + select_y
        }
        if (add_count_option.value.split("-")[1] == select_y || add_count_option.value.split("-")[1] == "bin_y") {
            // x_axis.appendChild(add_count_option)
            x_axis.insertBefore(add_count_option, x_axis.children[1])
        }
        state_change["encodings"]["y"]["data"] = select_y
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    console.log(state_change)
    
  }

  const updateXSelectedValue = () => {
    let select_x = document.getElementById("data-x").value
    console.log(select_x)
    let state_change = currentItemState
    if (!select_x) {
        removeDataEncoding(loadVis, "x")
        state_change["encodings"]["x"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        removeAction(loadVis, "x", "count");
        removeAction(loadVis, "x", "bin");
        removeAction(loadVis, "y", "bin");
        updateDataEncoding(loadVis, "x", select_x, dataset)
        let y_axis = document.getElementById("data-y")
        let add_count_option = document.createElement("option")
        removeOption(loadVis, y_axis, "count", "y")
        add_count_option.innerHTML = "Count of " + select_x
        if (dataset[select_x] && dataset[select_x]["type"] == "quantitative") {
            add_count_option.value = "count-bin_x-" + select_x
            removeAction(loadVis, "x", "sum")
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                updateDataEncoding(loadVis, "x", "sum-"+select_x, dataset)
            }
            // removeSumOf(y_axis) // remove sums from the other axis
            // removeDataEncoding(loadVis, "y")
           
        } else if (dataset[select_x]) {
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                // if the current value on y axis is quantative and x value is not, set the y value to be sum again
                let current_y_value = document.getElementById("data-y").value
                if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
                    updateDataEncoding(loadVis, "y", "sum-"+current_y_value, dataset)
                }
            
            }
            // if (!sumOptionsAddedY) {
                let current_axis = document.getElementById("data-x")
                // removeSumOf(current_axis) // remove sums from the current axis
                // addSumOf(y_axis, current_axis, dataset)
                // setSumOptionsAddedY(true);
            // }
            add_count_option.value = "count-" + select_x
        }
        if (add_count_option.value.split("-")[1] == select_x || add_count_option.value.split("-")[1] == "bin_x") {
            // y_axis.appendChild(add_count_option)
            y_axis.insertBefore(add_count_option, y_axis.children[1])
        }
        
        state_change["encodings"]["x"]["data"] = select_x
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    
  }

  const updateColorSelectedValue = () => {
    let select_color = document.getElementById("data-color").value
    console.log(select_color)
    let state_change = currentItemState
    if (!select_color) {
        removeDataEncoding(loadVis, "color")
        state_change["encodings"]["color"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        updateDataEncoding(loadVis, "color", select_color, dataset)
        state_change["encodings"]["color"]["data"] = select_color
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    
  }

  const updateSizeSelectedValue = () => {
    let select_size = document.getElementById("data-size").value
    console.log(select_size)
    let state_change = currentItemState
    if (!select_size) {
        removeDataEncoding(loadVis, "size")
        state_change["encodings"]["size"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        updateDataEncoding(loadVis, "size", select_size, dataset) 
        state_change["encodings"]["size"]["data"] = select_size
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    
  }

  const recordAnswer = (qid, answer) => {
    // console.log(current_element.target.parentNode.id)
    console.log(qid)
    console.log(answer)
    console.log(usabilityItemAnswers)
    let item_key = "q"+qid
    let update_answers = usabilityItemAnswers
    update_answers[item_key] = answer
    setUsabilityItemAnswers(update_answers)
    console.log(usabilityItemAnswers)
    let usability_options_container = document.getElementById("usabilityChoiceOptionContainer").children
   
    for (let index = 1; index <= 5; index += 1) {
        document.getElementById(item_key+"-"+index.toString()).classList.remove("selectedAnswer")
    }
    document.getElementById(item_key+"-"+answer.toString()).classList.add("selectedAnswer")
    // setItemAnswer(answer)
    // if (highlight_id == "TFoptionT") {
    //     document.getElementById(highlight_id).classList.add("selectedAnswer")
    //     document.getElementById("TFoptionF").classList.remove("selectedAnswer")
    // } else {
    //     document.getElementById(highlight_id).classList.add("selectedAnswer")
    //     console.log(document.getElementById(highlight_id))
    //     document.getElementById("TFoptionT").classList.remove("selectedAnswer")
    // }
    
  }

  const nextItem = (e) => {
    
    console.log("clicking next")
    console.log(itemAnswer)
    // if (showTextBox && itemAnswer == "no answer") {
    //     document.getElementById("requiredLabel").classList.add("showDescription")
    //     document.getElementById("requiredLabel").classList.remove("hideDescription")
    // }
    let ready = true
    for (var key in usabilityItemAnswers) {
        console.log(key)
        if (usabilityItemAnswers[key] == 0) {
            document.getElementById("usability_"+key).classList.add("highlightRequired")
            document.getElementById("requiredLabel_"+key).classList.add("showDescription")
            document.getElementById("requiredLabel_"+key).classList.remove("hideDescription")
            // document.getElementById("usability_"+key).focus()
            document.getElementById("scrollUp").classList.remove("hideDescription")
            ready = false
        } else {
            document.getElementById("usability_"+key).classList.remove("highlightRequired")
            document.getElementById("requiredLabel_"+key).classList.add("hideDescription")
            document.getElementById("requiredLabel_"+key).classList.remove("showDescription")
        }
    }

    if (ready) {
        document.getElementById("scrollUp").classList.add("hideDescription")
        document.getElementById("proceeding").classList.remove("hideDescription")
        let text_answer = document.getElementById("usabilityQuestionAnswer").value
        updateProgress(pID, "training"+props.item)
        // console.log(document.getElementById("nextButtonValue").value)
        handleSubmit(e, "usability_checks", startTime, text_answer)
    }

    // console.log(showTextBox)
    // if (props.assessment && !showTextBox) {
    //     setShowTextBox(true);
    //     return;
    // }
    // let current_item = props.item;
    // let next_item = current_item + 1
    // console.log(next_item)
    
    // if (next_item <= 40) {

    //     let text_answer = ""
    //     if (props.assessment) {
    //       text_answer = document.getElementById("questionAnswer").value
    //     } else {
    //       text_answer = "placeholder"
    //     }
    //     console.log(text_answer)
    //     if (text_answer) {
    //         // let text_answer = "placeholder"
    //         document.getElementById("proceeding").classList.remove("hideDescription")
    //         // console.log(document.getElementById("nextButtonValue").value)
    //         handleSubmit(e, "item_"+current_item, startTime, text_answer)
    //         // let url_pid = "?PROLIFIC_PID=" + pID;
    //         // router.push('/Q'+next_item+url_pid)
    //     }
 
      
      
    // }
    

  }

  const redirecting = () => {
    // router.push(redirectTo)
    // location.href = redirectTo
    router.push(redirectTo)
  }
  


  return (
    <div id="globalContainer">
    
    {loading ? null  :
    (redirectTo != "") ? 
    (redirecting()) : 
    <div id="interactionZone">
        <p><b>{itemBank[currentItem]["question_meta_data"]["question_topic"]}</b></p>
        <hr></hr>
        {itemBank[currentItem]["question_meta_data"]["question_text"].map((question, index) => (
            <div className='usabilityQA' id={"usability_q"+index} key={question}>
                <p><b>{question} <span style={{color:"red"}}>*</span></b> <span style={{color:"red"}} className="hideDescription" id={"requiredLabel_q"+index}>Selection required</span></p>
                <div id="usabilityLabelsContainer">
                    <div className="usabilityChoiceLabel">
                        <label>Strongly Disagree</label>
                        
                    </div >
                    <div className="usabilityChoiceLabel">
                        
                    </div>
                    <div className="usabilityChoiceLabel">
                        
                    </div>
                    <div className="usabilityChoiceLabel">
                        
                    </div>
                    <div className="usabilityChoiceLabel">
                        <label>Strongly Agree</label>
                        
                    </div>
                    
                </div>
                <div id="usabilityChoiceOptionContainer">
                    <div className="usabilityChoiceOption" id={"q"+index+"-1"} onClick={() => recordAnswer(index, 1)}><p>1</p></div>
                    <div className="usabilityChoiceOption" id={"q"+index+"-2"} onClick={() => recordAnswer(index, 2)}><p>2</p></div>
                    <div className="usabilityChoiceOption" id={"q"+index+"-3"} onClick={() => recordAnswer(index, 3)}><p>3</p></div>
                    <div className="usabilityChoiceOption" id={"q"+index+"-4"} onClick={() => recordAnswer(index, 4)}><p>4</p></div>
                    <div className="usabilityChoiceOption" id={"q"+index+"-5"} onClick={() => recordAnswer(index, 5)}><p>5</p></div>
                    
                </div>
                <hr></hr>
            
            </div>
        ))}
        <div className='usabilityQA'>
            <p><label htmlFor="usabilityQuestionAnswer"><b>If you have any additional reasoning or comments, please enter them below:</b></label></p>
            <textarea id="usabilityQuestionAnswer" name="usabilityQuestionAnswer" rows="2" cols="35" placeholder='Optional'></textarea>
        </div>
        <p id='proceeding' className='hideDescription'>Proceeding...</p>
        <p id='scrollUp' className='hideDescription'><span style={{color:"red"}}>Please answer all questions marked with *</span></p>
        <div id="nextButton" style={{marginBottom:"6rem"}} onClick={(e) => nextItem(e)}>
            <p>Next</p>
        </div>
        
        {/* {isClient && !showTextBox ? <QuestionText question={itemBank[currentItem]["question_meta_data"]}></QuestionText> : null}
        {!showTextBox ? <hr></hr> : null}
        {!showTextBox ? <div id="workingTiles">
            <div id='chartTypes'>
            {!props.assessment ? <div id="toReconstruct"></div> : null}
                {props.assessment ? <div>
                    <p>Select a mark type for your chart</p>
                    <div id="chartTypesTiles">
                    {chart_types.map(chart_tiles => (
                        <div className="chartTilesContainer" key={chart_tiles} id={chart_tiles+"_container"}>
                            <img className="chartTiles" src={tileSets[chart_tiles]["chart"]} onClick={() => changeChartType(chart_tiles)}></img>
                        </div>
                    ))}
                    </div>
                </div> : null}
            </div>
            <div id='data'>
                {!props.assessment ? <div id='chartTypes'>
                    <p>Select a mark type for your chart</p>
                    <p><i>This determines the chart type.</i></p>
                    <div id="chartTypesTiles">
                    {chart_types.map(chart_tiles => (
                        <div className="chartTilesContainer" key={chart_tiles} id={chart_tiles+"_container"}>
                            <img className="chartTiles" src={tileSets[chart_tiles]["chart"]} onClick={() => changeChartType(chart_tiles)}></img>
                        </div>
                    ))}
                    </div>
                </div> : null}
            </div>
        </div> : null} */}
        
     
      </div>}
    
    </div>

  );
}

export default UsabilityCheck;
