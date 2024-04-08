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
import { useRouter, usePathname, useSearchParams, redirect } from 'next/navigation'

async function addDataToFireStore(prolificID, questionID, vis_answer, text_answer, TFanswer, item_start) {
  try {
    const docRef = await setDoc(doc(db, prolificID, questionID), {
      timestamp: serverTimestamp(),
      vis_answer: vis_answer,
      TF_answer: TFanswer,
      text_answer: text_answer,
      item_startTime: item_start,
      item_endTime: new Date().getTime()
    }, { merge: true });
    console.log("Doc written with ID: ", prolificID);
    return true;
  } catch (error) {
    console.error("Error ", error)
    return false;
  }
}

async function addProgress(prolificID, current_item, created_vis, load_text_box, selected_chart, selected_var) {
    try {
      const docRef = await updateDoc(doc(db, prolificID, "progress"), {
        completed_item: current_item,
        auto_load_TF: load_text_box,
        created_vis: created_vis,
        selected_chart: selected_chart,
        selected_var: selected_var
      });
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

const ConstructionItemComponent = (props) => {
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
//   const [dataset, setDataset] = useState(props.item_bank["datasets"][props.item_bank[props.mode+props.item]["dataset"]]);
  const [dataset, setDataset] = useState("")
//   const [loadVis, setLoadVis] = useState(props.item_bank[props.mode+props.item]["question_vis"]);
  const [loadVis, setLoadVis] = useState({});
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
  const [currentProgress, setCurrentProgress] = useState({})
  const [redirectTo, setRedirectTo] = useState("")
  const [loading, setLoading] = useState(true);
  
  console.log("in CREATE item component!")
  console.log(props)
  console.log(props.item_bank)
  console.log(pathname)
  console.log(searchParams)
  const handleSubmit = async (e, questionID, time_start, text_answer, TFanswer, item_start) => {
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
      if (questionID.split("_")[1] == 1) {
        const add_time_start = await initializeTime(pID, questionID, time_start)
        if (!add_time_start) {
          // setPID("");
          setScore("");
          alert("An error occurred. Please contact the survey administrator.");
        }
      }
      const added = await addDataToFireStore(pID, questionID, loadVis, text_answer, TFanswer, item_start);
      if (!added) {
        // setPID("");
        setScore("");
        alert("An error occurred. Please contact the survey administrator.");
      } else {
        if (props.item == 15) {
            location.href = "https://app.prolific.com/submissions/complete?cc=C17SX24M";
        }
        let url_pid = "?PROLIFIC_PID=" + pID;
        let next_item = props.item + 1
        if (props.assessment) {
            router.push('/Q'+next_item+url_pid)
        } else {
            router.push('/start10'+next_item+url_pid)
        }
        
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
            console.log(window.location.href)
            if (current_progress["completed_item"] == "consent") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/training" + url_pid
                if (window.location.href.includes("training")) {
                    setRedirectTo("")
                    setShowTextBox(false)
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
                    setShowTextBox(false)
                } else {
                    setRedirectTo(redirect_url)
                }

                // setRedirectTo(redirect_url)
            } else if (current_progress["completed_item"] == "instructions") {
                let url_pid = "?PROLIFIC_PID=" + prolific_ID;
                let redirect_url = "/Q1" + url_pid
                if (window.location.href.includes("Q1")) {
                    setRedirectTo("")
                    setShowTextBox(current_progress["auto_load_TF"])
                    console.log(current_progress["auto_load_TF"])
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
                        setShowTextBox(false)
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
                            console.log(current_progress["auto_load_TF"])
                            console.log(showTextBox)
                            setShowTextBox(current_progress["auto_load_TF"])
                            console.log(current_progress["created_vis"])
                            setSelectedChart(true)
                            setSelectedVar(true);
                        } else {

                            setRedirectTo(redirect_url)
                        }
                    }
                }
            }
        
            if (props.assessment && props.item <= 15) {
                let index = props.item
                let item_order = current_progress["randomized_order"]
                setCurrentItem(props.mode+item_order[index-1])
                setDataset(props.item_bank["datasets"][props.item_bank[props.mode+item_order[index-1]]["dataset"]])
                console.log(showTextBox)
                console.log("VIS??")
                if (current_progress["auto_load_TF"] == false) {
                    setLoadVis(props.item_bank[props.mode+item_order[index-1]]["question_vis"]) 
                    setSelectedChart(false)
                    setSelectedVar(false);
                } else {
                    setLoadVis(current_progress["created_vis"])
                    setSelectedChart(current_progress["selected_chart"])
                    setSelectedVar(current_progress["selected_var"]);
                    // setSelectedChart(false)
                    // setSelectedVar(false);
                }
               
                
            } else {
                setCurrentItem(props.mode+props.item)
                setDataset(props.item_bank["datasets"][props.item_bank[props.mode+props.item]["dataset"]])
                setLoadVis(props.item_bank[props.mode+props.item]["question_vis"])
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

  const updateProgress = async (prolificID, completed_item, load_text_box, select_chart, selected_var) => {
    console.log(loadVis)
    if (prolificID) {
      const added_progress = await addProgress(prolificID, completed_item, loadVis, load_text_box, select_chart, selected_var);
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
      setIsClient(true);
      const queryString = window.location.search;
      console.log(queryString);
  
      const urlParams = new URLSearchParams(queryString);
      console.log(urlParams)
  
      const prolific_ID = urlParams.get('PROLIFIC_PID')
      console.log(prolific_ID)
      setPID(prolific_ID);

      checkProgress(prolific_ID)

      setShowTextBox(false)
          
      
      
    }, [])

  if (isClient) {

    console.log(loadVis)
    // let mark_spec = require(item_bank["item"+currentItem.toString()]["initialize"]["question_vis"]);
    // console.log(props.item_bank["training"+props.item]["model_vis"])

    if (!loading) {
         embed('#questionVis', loadVis, {"actions": false});
        if (!props.assessment) {
            embed("#toReconstruct", props.item_bank["training"+props.item]["model_vis"], {"actions": false})
        }
    }
   
    
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
    let update_vis_spec = loadVis
    let use_vis_spec = loadVis
    if (clicked_chart == "line" || clicked_chart == "point") {
        if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
          update_vis_spec = removeAction(use_vis_spec, "y", "sum")
          use_vis_spec = update_vis_spec
        }
        if (dataset[current_x_value] && dataset[current_x_value]["type"] == "quantitative") {
          update_vis_spec = removeAction(use_vis_spec, "x", "sum")
          use_vis_spec = update_vis_spec
        }
    } else {
        if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
            if (!current_x_value.includes("count")) {
              update_vis_spec = updateDataEncoding(use_vis_spec, "y", "sum-"+current_y_value, dataset)
              use_vis_spec = update_vis_spec
            }
            
        }
        if (dataset[current_x_value] && dataset[current_x_value]["type"] == "quantitative") {
            if (!current_y_value.includes("count")) {
              update_vis_spec = updateDataEncoding(use_vis_spec, "x", "sum-"+current_x_value, dataset)
              use_vis_spec = update_vis_spec
            }
        }
    }
    let vis_update = update_vis_spec
    
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
    
    update_vis_spec = updateMark(use_vis_spec, clicked_chart)
    use_vis_spec = update_vis_spec

    setSelectedChart(true);
    let chart_tiles = document.getElementsByClassName("chartTilesContainer")
    console.log(chart_tiles)
    for (let index = 0; index < chart_tiles.length; index += 1) {
      if (chart_tiles[index].classList.contains("selectedChart")) {
        chart_tiles[index].classList.remove("selectedChart");
      }
    }
    document.getElementById(clicked_chart+"_container").classList.add("selectedChart")
    setLoadVis(update_vis_spec)
  }



  const removeOption = (check_element, to_remove, from_encoding) => {
    console.log("in remove options")
    console.log(to_remove)
    // let update_vis_spec = loadVis
    // let use_vis_spec = loadVis
    // console.log(use_vis_spec)
    // update_vis_spec = removeAction(use_vis_spec, from_encoding, to_remove);
    // use_vis_spec = update_vis_spec
    for (let i = 0; i < check_element.length; i += 1) {
        if (check_element.options[i].value.includes(to_remove)) {
            check_element.remove(i)
            // update_vis_spec = removeAction(use_vis_spec, from_encoding, to_remove);
            // use_vis_spec = update_vis_spec
        }
    }
    // setLoadVis(update_vis_spec)
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
    console.log(loadVis)
    let update_vis_spec = loadVis
    let use_vis_spec = loadVis
    if (!select_y) {
        update_vis_spec = removeDataEncoding(use_vis_spec, "y")
        use_vis_spec = update_vis_spec
        state_change["encodings"]["y"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        update_vis_spec = removeAction(use_vis_spec, "y", "count");
        use_vis_spec = update_vis_spec
        update_vis_spec = removeAction(use_vis_spec, "y", "bin");
        use_vis_spec = update_vis_spec
        update_vis_spec = removeAction(use_vis_spec, "x", "bin");
        use_vis_spec = update_vis_spec
        update_vis_spec = updateDataEncoding(use_vis_spec, "y", select_y, dataset)
        use_vis_spec = update_vis_spec
        let x_axis = document.getElementById("data-x")
        removeOption(x_axis, "count", "x")
        update_vis_spec = removeAction(use_vis_spec, "x", "count");
        use_vis_spec = update_vis_spec
        let add_count_option = document.createElement("option")
        add_count_option.innerHTML = "Count of Records (" + select_y + ")"
        if (dataset[select_y] && dataset[select_y]["type"] == "quantitative") {
            add_count_option.value = "count-bin_y-" + select_y
            update_vis_spec = removeAction(use_vis_spec, "y", "sum")
            use_vis_spec = update_vis_spec
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                update_vis_spec = updateDataEncoding(use_vis_spec, "y", "sum-"+select_y, dataset)
                use_vis_spec = update_vis_spec
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
                    update_vis_spec = updateDataEncoding(use_vis_spec, "x", "sum-"+current_x_value, dataset)
                    use_vis_spec = update_vis_spec
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
    setLoadVis(update_vis_spec)
  }

  const updateXSelectedValue = () => {
    let select_x = document.getElementById("data-x").value
    console.log(select_x)
    console.log(loadVis)
    let state_change = currentItemState
    let update_vis_spec = loadVis
    let use_vis_spec = loadVis
    if (!select_x) {
        update_vis_spec = removeDataEncoding(use_vis_spec, "x")
        use_vis_spec = update_vis_spec
        state_change["encodings"]["x"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        update_vis_spec = removeAction(use_vis_spec, "x", "count");
        use_vis_spec = update_vis_spec
        update_vis_spec = removeAction(use_vis_spec, "x", "bin");
        use_vis_spec = update_vis_spec
        update_vis_spec = removeAction(use_vis_spec, "y", "bin");
        use_vis_spec = update_vis_spec
        update_vis_spec = updateDataEncoding(use_vis_spec, "x", select_x, dataset)
        use_vis_spec = update_vis_spec
        let y_axis = document.getElementById("data-y")
        let add_count_option = document.createElement("option")
        removeOption(y_axis, "count", "y")
        update_vis_spec = removeAction(use_vis_spec, "y", "count");
        use_vis_spec = update_vis_spec
        add_count_option.innerHTML = "Count of Records (" + select_x + ")"
        if (dataset[select_x] && dataset[select_x]["type"] == "quantitative") {
            add_count_option.value = "count-bin_x-" + select_x
            console.log(use_vis_spec)
            update_vis_spec = removeAction(use_vis_spec, "x", "sum")
            use_vis_spec = update_vis_spec
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                update_vis_spec = updateDataEncoding(use_vis_spec, "x", "sum-"+select_x, dataset)
                use_vis_spec = update_vis_spec
            }
            // removeSumOf(y_axis) // remove sums from the other axis
            // removeDataEncoding(loadVis, "y")
           
        } else if (dataset[select_x]) {
            // default to sum aggregation for bar and area
            if (currentChartType == "bar" || currentChartType == "area") {
                // if the current value on y axis is quantative and x value is not, set the y value to be sum again
                let current_y_value = document.getElementById("data-y").value
                if (dataset[current_y_value] && dataset[current_y_value]["type"] == "quantitative") {
                    update_vis_spec = updateDataEncoding(use_vis_spec, "y", "sum-"+current_y_value, dataset)
                    use_vis_spec = update_vis_spec
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
    setLoadVis(update_vis_spec)
    
  }

  const updateColorSelectedValue = () => {
    let select_color = document.getElementById("data-color").value
    console.log(select_color)
    let state_change = currentItemState
    let use_vis_spec = loadVis
    let update_vis_spec = loadVis
    if (!select_color) {
        update_vis_spec = removeDataEncoding(use_vis_spec, "color")
        use_vis_spec = update_vis_spec
        state_change["encodings"]["color"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        update_vis_spec = updateDataEncoding(use_vis_spec, "color", select_color, dataset)
        use_vis_spec = update_vis_spec
        state_change["encodings"]["color"]["data"] = select_color
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    setLoadVis(update_vis_spec)
    
  }

  const updateSizeSelectedValue = () => {
    let select_size = document.getElementById("data-size").value
    console.log(select_size)
    let state_change = currentItemState
    let use_vis_spec = loadVis
    let update_vis_spec = loadVis
    if (!select_size) {
        update_vis_spec = removeDataEncoding(use_vis_spec, "size")
        use_vis_spec = update_vis_spec
        state_change["encodings"]["size"]["data"] = ""
        setCurrentItemState(state_change)
    } else {
        update_vis_spec = updateDataEncoding(use_vis_spec, "size", select_size, dataset) 
        use_vis_spec = update_vis_spec
        state_change["encodings"]["size"]["data"] = select_size
        setCurrentItemState(state_change)
        setSelectedVar(true);
    }
    setLoadVis(update_vis_spec)
    
  }

  const recordAnswer = (answer, highlight_id) => {
    setItemAnswer(answer)
    if (highlight_id == "TFoptionT") {
        document.getElementById(highlight_id).classList.add("selectedAnswer")
        document.getElementById("TFoptionF").classList.remove("selectedAnswer")
    } else {
        document.getElementById(highlight_id).classList.add("selectedAnswer")
        console.log(document.getElementById(highlight_id))
        document.getElementById("TFoptionT").classList.remove("selectedAnswer")
    }
    
  }

  const nextItem = (e) => {
    
    console.log("clicking next")
    console.log(itemAnswer)
    
    let prev_index = props.item-1
    let prev_item = "item_"+prev_index
    if (prev_index <= 0) {
        prev_item = "instructions"
    }
    if (showTextBox && itemAnswer == "no answer") {
        document.getElementById("requiredLabel").classList.add("showDescription")
        document.getElementById("requiredLabel").classList.remove("hideDescription")
        console.log(selectedChart)
        console.log(selectedVar)
        updateProgress(pID, prev_item, showTextBox, selectedChart, selectedVar)
        return;
    }

    console.log(showTextBox)
    if (props.assessment && !showTextBox) {
        setShowTextBox(true);
        updateProgress(pID, prev_item, true, selectedChart, selectedVar)
        return;
    }
    let current_item = props.item;
    let next_item = current_item + 1
    console.log(next_item)
    
    if (props.assessment) {
        if (next_item <= 16) {

            // let text_answer = ""
            // if (props.assessment) {
            let text_answer = document.getElementById("questionAnswer").value
            // } else {
            // text_answer = "placeholder"
            // }
            // console.log(text_answer)
            
            // let text_answer = "placeholder"
            document.getElementById("proceeding").classList.remove("hideDescription")
            updateProgress(pID, "item_"+props.item, false, selectedChart, selectedVar)
            // console.log(document.getElementById("nextButtonValue").value)
            handleSubmit(e, "item_"+current_item, startTime, text_answer, itemAnswer, startTime)
            // let url_pid = "?PROLIFIC_PID=" + pID;
            // router.push('/Q'+next_item+url_pid)
        
        
        }
    } else {
        if (next_item <= 6) {
            let chart_tiles = document.getElementsByClassName("chartTilesContainer")
            console.log(chart_tiles)
            // let answered = false
            // for (let index = 0; index < chart_tiles.length; index += 1) {
            //   if (chart_tiles[index].classList.contains("selectedChart")) {
            //     answered = true
            //   }
            // }
            if (!selectedChart || !selectedVar) {
              document.getElementById("questionContainer").classList.add("highlightRequired")
              document.getElementById("questionContainer").focus()
              return;
            }
            let text_answer = ""
            document.getElementById("proceeding").classList.remove("hideDescription")
            updateProgress(pID, "training_"+props.item, false, selectedChart, selectedVar)
            // console.log(document.getElementById("nextButtonValue").value)
            handleSubmit(e, "training_"+current_item, startTime, text_answer, itemAnswer, startTime)
        }
    }
    
    

  }

  const redirecting = () => {
    // router.push(redirectTo)
    // setLoading(true)
    console.log(window.location.href)
    console.log(redirectTo)
    // location.href = redirectTo
    router.push(redirectTo)
  }


  return (
    <div id="globalContainer">
    
    {!isClient ? <div>
        <div id="questionVis" style={{display:"none"}} ></div>
        <div id="toReconstruct" style={{display:"none"}} ></div>
    </div> :
    (loading) ? <div>
        <div id="questionVis" style={{display:"none"}} ></div>
        <div id="toReconstruct" style={{display:"none"}} ></div>
        </div> :
    (redirectTo != "") ? <div>{redirecting()}
    <div id="questionVis" style={{display:"none"}} ></div>
    <div id="toReconstruct" style={{display:"none"}} ></div>
    </div>
    :<div id="interactionZone">
        {isClient && !showTextBox ? <QuestionText question={itemBank[currentItem]["question_meta_data"]}></QuestionText> : null}
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
        </div> : null}
        <div id='visContainer' >
            
            { !showTextBox ? <div id="yAxis">
                <p id="yAxisLabel">Y-axis</p>
                <div id='encodings'>
                <div>
                    <div className='mappingContainer'>
                    
                      <select name="data-y" id="data-y" defaultValue="" onChange={() => updateYSelectedValue()}>
                        <option value=""></option>
                        {data_columns.map(variable => ( 
                            <option key={variable} value={variable}>{dataset[variable]["full_name"]}</option>
                        ))}
                        
                      </select>
                    
                    </div>
                  
                </div>
              </div>

            </div>: null}
           
            <div>
            {(!selectedChart || !selectedVar) ? <div id="placeholderInstructions">
                {showTextBox ? <p>No chart created</p> : !selectedChart ? 
                <p><i>Select a mark type from the <b>tiles above</b></i></p> : 
                <p><i>Select variables from <b>dropdown lists</b></i></p>}
            </div>: null}
            <div id="questionVis">
            </div>
            {!showTextBox ? <div id='encoding_x'>
            <div className='xContainer'>
                <div>
                    <p id="xAxisLabel">X-axis</p>
                </div>
                <div>
                    <div className='mappingContainerX'>
                        <div className="xTiles">
                            
                                <select name="data-x" id="data-x" defaultValue="" onChange={() => updateXSelectedValue()}>
                                    <option value=""></option>
                                    {data_columns.map(variable => ( 
                                        <option key={variable} value={variable}>{dataset[variable]["full_name"]}</option>
                                    ))}
                                
                                </select>
                            </div>
                        
                        </div>
                        
                    </div>
                </div>
            </div> : null}
            </div>
            <div id='encodings'>
                {!showTextBox ? <div className='mappingContainerColorSize'>
                    <div>
                        <p>Color</p>
                        <select name="data-color" id="data-color" defaultValue="" onChange={() => updateColorSelectedValue()}>
                            <option value=""></option>
                            {data_columns.map(variable => ( 
                                <option key={variable} value={variable}>{dataset[variable]["full_name"]}</option>
                            ))}
                        </select> 
                    </div>
                    <div>
                        <p>Size</p>
                        <select name="data-size" id="data-size" defaultValue="" onChange={() => updateSizeSelectedValue()}>
                            <option value=""></option>
                            {data_columns.map(variable => ( 
                                <option key={variable} value={variable}>{dataset[variable]["full_name"]}</option>
                            ))}
                        </select> 
                    </div>
                    
              
                </div> : null}
                 
                
                {showTextBox ? <div id="answerVis">
                    <p><b>True or False <span style={{color:"red"}}>*</span></b> <span style={{color:"red"}} className="hideDescription" id="requiredLabel">Selection required</span></p>
                    {itemBank[currentItem]["question_meta_data"]["attention_check"] ? <p>{itemBank[currentItem]["question_meta_data"]["attention_check"]}</p> : <p>{itemBank[currentItem]["question_meta_data"]["question_text"]}</p>}
                    <div id="TFoptions">
                        <div className="choiceOption" id="TFoptionT" onClick={() => recordAnswer(true, "TFoptionT")}><p>True</p></div>
                        <div className="choiceOption" id="TFoptionF" onClick={() => recordAnswer(false, "TFoptionF")}><p>False</p></div>
                        
                    </div>
                    <p><label htmlFor="questionAnswer">If you have any additional reasoning or comments, please explain below:</label></p>
                    <textarea id="questionAnswer" name="questionAnswer" rows="2" cols="35" placeholder='Optional'></textarea>
                    {/* <p className="hideDescription" id="requiredLabel" style={{color:"red"}}>* This is required</p> */}
                </div> : null}
                <div id="nextButton" style={{marginBottom:"4rem"}} onClick={(e) => nextItem(e)}>
                    <p>Next</p>
                </div>
                <p id='proceeding' className='hideDescription'>Proceeding...</p>

              </div>
        
        </div>
     
      </div>}
    
    </div>

  );
}

export default ConstructionItemComponent;
