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

// async function addDataToFireStore(prolificID, questionID, vis_answer, text_answer) {
//   try {
//     const docRef = await setDoc(doc(db, prolificID, questionID), {
//       timestamp: serverTimestamp(),
//       vis_answer: vis_answer,
//       text_answer: text_answer
//     }, { merge: true });
//     console.log("Doc written with ID: ", prolificID);
//     return true;
//   } catch (error) {
//     console.error("Error ", error)
//     return false;
//   }
// }

// async function initializeTime(prolificID, questionID, time_start) {
//   try {
//     const docRef = await setDoc(doc(db, prolificID, questionID), {
//       timestamp_start: time_start
//     }, { merge: true });
//     console.log("Doc written with ID: ", prolificID);
//     return true;
//   } catch (error) {
//     console.error("Error ", error)
//     return false;
//   }
// }

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

function updateEncodingMapping(vis_spec, encoding, update_to, data_columns) {
  console.log("in update x")
  console.log(vis_spec)
  console.log(encoding)
  console.log(update_to)
  if (encoding.includes("color")) {
    if (!vis_spec["encoding"]["color"]) {
      vis_spec["encoding"]["color"] = {}
    }
    vis_spec["encoding"]["color"]["field"] = update_to;
    vis_spec["encoding"]["color"]["type"] = data_columns[update_to]["type"];
    // console.log(vis_spec["encoding"]["color"]["title"])
    // vis_spec["encoding"]["color"]["title"] = data_columns[update_to]["full_name"]
    // vis_spec["encoding"]["color"]["field"] = update_to;
    // vis_spec["encoding"]["color"]["type"] = data_columns[update_to];
    // vis_spec["encoding"]["color"]["scale"]["scheme"] = "purplegreen"
    // {"field": update_to, "type": data_columns[update_to]};
    console.log(vis_spec);
    let color_scheme = encoding.split("_")[0];
    console.log(color_scheme)
    // diverging color scheme
    if (color_scheme == "div") {
      vis_spec["encoding"]["color"]["scale"] = {"scheme": "purpleorange"};
      // vis_spec["encoding"]["color"] = {...vis_spec["encoding"]["color"], scale: {scheme: "purplegreen"}}
      // let scale_value = {}
      // scale_value["scale"] = {"scheme": "purplegreen"}
      // // vis_spec["encoding"]["color"]["scale"] = new Map();
      // console.log(scale_value);
      // vis_spec["encoding"]["color"].scale = {};
      // vis_spec["encoding"]["color"].scale.scheme = "purplegreen"
      console.log(vis_spec)
      // ["scheme"] = "purplegreen";
    } else if (color_scheme == "seq") {
      vis_spec["encoding"]["color"]["scale"] = {"scheme": "purplebluegreen"};
      // console.log(vis_spec["encoding"]["color"])
      // embed('#questionVis', vis_spec, {"actions": false});
    } else if (color_scheme == "qual") {
      vis_spec["encoding"]["color"]["scale"] = {"scheme": "dark2"};
    }
  }
  else {
    if (!vis_spec["encoding"][encoding]) {
      vis_spec["encoding"][encoding] = {}
    }
    vis_spec["encoding"][encoding]["field"] = update_to
    vis_spec["encoding"][encoding]["type"] = data_columns[update_to]["type"];
  }

  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec

}

function removeDataEncoding(vis_spec, encoding, remove_data) {
  console.log("in remove data encoding")
  console.log(vis_spec)
  console.log(encoding)
  console.log(remove_data)
  // console.log(mapping_state)
  if (encoding.includes("color")) {
    console.log(encoding);
    vis_spec["encoding"]["color"]["field"] = "";
    vis_spec["encoding"]["color"]["type"] = "";
  } else {
    vis_spec["encoding"][encoding]["field"] = "";
    vis_spec["encoding"][encoding]["type"] = "";
  }

  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}

function updateMark(vis_spec, mark) {
  console.log("in update mark")
  console.log(vis_spec, mark)
  vis_spec["mark"]["type"] = mark;
  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}

function updateTransformationMapping(vis_spec, transformation_encoding, add_transformation, data_columns) {
  console.log("in update transformation!")
  console.log(transformation_encoding)
  console.log(add_transformation)
  console.log(vis_spec)
  if (transformation_encoding.includes("color")) {
    transformation_encoding = "color"
  }
  if (!vis_spec["encoding"][transformation_encoding]) {
    vis_spec["encoding"][transformation_encoding] = {};
  }
  if (add_transformation == "bin") {
    vis_spec["encoding"][transformation_encoding][add_transformation] = true
  } else if (add_transformation == "count" || add_transformation == "sum") {
    vis_spec["encoding"][transformation_encoding]["aggregate"] = add_transformation;
  } 
  // else if (add_transformation == "asc_sort") {
  //   vis_spec["encoding"][transformation_encoding]["sort"] = "ascending";
  // } 
  else if (add_transformation == "des_sort") {
    if (transformation_encoding == "x") {
      vis_spec["encoding"]["y"]["sort"] = "-x";
    } else if (transformation_encoding == "y") {
      vis_spec["encoding"]["x"]["sort"] = "-y";
    }
  } else if (add_transformation == "stack") {
    vis_spec["encoding"][transformation_encoding]["stack"] = true;
  } else if (add_transformation == "reverse") {
    if (transformation_encoding.includes("color")) {
      vis_spec["encoding"][transformation_encoding]["scale"]["reverse"] = true;
    } else {
      vis_spec["encoding"][transformation_encoding]["scale"] = {"reverse": true};
    }
    
  } else if (add_transformation == "mean") {
    // averaging anything other than x or y doesn't make sense
    if (transformation_encoding == "x" || transformation_encoding == "y") {
      vis_spec["encoding"][transformation_encoding]["aggregate"] = "mean";
    }
  } else if (add_transformation == "truncate") {
    console.log(data_columns)
    console.log(vis_spec)
    let encoding_data = vis_spec["encoding"][transformation_encoding]["field"] // constraint: truncate only works when there's data mapped to encoding
    // if able to perform domain adjustments
    if (encoding_data && data_columns[encoding_data]["truncate"]) {
      if (!vis_spec["encoding"][transformation_encoding]["scale"]) {
        vis_spec["encoding"][transformation_encoding]["scale"] = {}
      }
      vis_spec["encoding"][transformation_encoding]["scale"]["domain"] = data_columns[encoding_data]["truncate"];
      // let marking = vis_spec["mark"]["type"]
      // vis_spec["mark"] = {}
      // vis_spec["mark"]["type"] = marking
      vis_spec["mark"]["clip"] = true
    }
  }
  // else if (add_transformation == "truncate") {
  //   let data_var = vis_spec["encoding"][transformation_encoding]["field"]
  //   if (data_columns[data_var]["truncate"]) {
  //     vis_spec["encoding"][transformation_encoding]["scale"] = {...vis_spec["encoding"][transformation_encoding]["scale"], domain: data_columns[data_var]["truncate"], nice: true};
  //     vis_spec["mark"] = {...vis_spec["mark"], clip: true}
  //   }
    
  // }
  console.log(vis_spec)
  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}

function removeTransformationEncoding(vis_spec, transformation_encoding, remove_transformation) {
  console.log("in remove transformation!")
  console.log(transformation_encoding)
  console.log(remove_transformation)
  if (transformation_encoding.includes("color")) {
    transformation_encoding = "color"
  }
  if (remove_transformation == "bin") {
    vis_spec["encoding"][transformation_encoding][remove_transformation] = false
  } else if (remove_transformation == "count" || remove_transformation == "sum") {
    vis_spec["encoding"][transformation_encoding]["aggregate"] = "";
  } 
  // else if (remove_transformation == "asc_sort") {
  //   vis_spec["encoding"][transformation_encoding]["sort"] = null;
  // } 
  else if (remove_transformation == "des_sort") {
    if (transformation_encoding == "x") {
      vis_spec["encoding"]["y"]["sort"] = "y";
    } else if (transformation_encoding == "y") {
      vis_spec["encoding"]["x"]["sort"] = "x";
    }
  } else if (remove_transformation == "stack") {
    vis_spec["encoding"][transformation_encoding]["stack"] = "";
  } else if (remove_transformation == "reverse") {
    if (transformation_encoding.includes("color")) {
      vis_spec["encoding"][transformation_encoding]["scale"]["reverse"] = false;
    } else {
      vis_spec["encoding"][transformation_encoding]["scale"] = {"reverse": false};
    }
  } else if (remove_transformation == "mean") {
    // averaging anything other than x or y doesn't make sense
    if (transformation_encoding == "x" || transformation_encoding == "y") {
      vis_spec["encoding"][transformation_encoding]["aggregate"] = "";
    }
  } else if (remove_transformation == "truncate") {
    // if able to perform domain adjustments
    if (vis_spec["encoding"][transformation_encoding]["scale"] && vis_spec["encoding"][transformation_encoding]["scale"]["domain"]) {
      delete vis_spec["encoding"][transformation_encoding]["scale"]["domain"];
      // let marking = vis_spec["mark"]["type"]
      // vis_spec["mark"] = {}
      // vis_spec["mark"]["type"] = marking
      vis_spec["mark"]["clip"] = false
    }
    
  }
  console.log(vis_spec)
  embed('#questionVis', vis_spec, {"actions": false});
  return vis_spec
}

const FinalInstructions = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false);
//   // const [PID, setPID] = useState("")
//   const [score, setScore] = useState("") 
//   const [chartTypeSelected, setChartTypeSelected] = useState("");
//   const [encodingsDisplay, setEncodingDisplay] = useState({});
//   const [draggedTile, setDraggedTile] = useState(null);
  const [currentItem, setCurrentItem] = useState("item"+props.item);
  const [itemBank, SetItemBank] = useState(props.training_set);
//   const [tileSets, setTileSets] = useState(props.tile_sets);
//   const [currentChartType, setCurrentChartType] = useState(props.training_set["item"+props.item]["initialize"]["chart_type"]);
//   const [dataset, setDataset] = useState(props.training_set["datasets"][props.training_set["item"+props.item]["dataset"]]);
//   const [loadVis, setLoadVis] = useState(props.training_set["item"+props.item]["question_vis"]);
//   const [currentItemState, setCurrentItemState] = useState(props.training_set["item"+props.item]["initialize"]);
//   const [bankStatus, setBankStatus] = useState({});
//   const [noTransformationDisplay, setNoTransformationDisplay] = useState([]);
  const [pID, setPID] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [currentProgress, setCurrentProgress] = useState({})
  const [redirectTo, setRedirectTo] = useState("")
  const [loading, setLoading] = useState(true);
  
//   console.log("in item component!")
//   console.log(props)
//   console.log(props.training_set)
//   console.log(pathname)
//   console.log(searchParams)
// //   const handleSubmit = async (e, questionID, time_start, text_answer) => {
// //     e.preventDefault();
// //     console.log("in handle submit!!")
// //     console.log(pID)
// //     console.log(itemBank[currentItem]["question_meta_data"]["question_text"])
// //     console.log(loadVis)
// //     // const queryString = window.location.search;
// //     // console.log(queryString);

// //     // const urlParams = new URLSearchParams(queryString);
// //     // console.log(urlParams)

// //     // const prolific_ID = urlParams.get('PROLIFIC_PID')
// //     // console.log(prolific_ID)

// //     if (pID) {
// //       if (questionID.split("_")[1] == 1) {
// //         const add_time_start = await initializeTime(pID, questionID, time_start)
// //         if (add_time_start) {
// //           // setPID("");
// //           setScore("");
// //           alert("start time added!");
// //         }
// //       }
// //       const added = await addDataToFireStore(pID, questionID, loadVis, text_answer);
// //       if (added) {
// //         // setPID("");
// //         setScore("");
// //         alert("Data added!");
// //       }
// //     }
    
// //   };

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
    //   if (!isClient) {
    //     if (props.item == 1) {
    //       let start_time = new Date().getTime()
    //       console.log("printing time!!")
    //       console.log(start_time)
    //       setStartTime(start_time)
    //     }
    //   }
      setIsClient(true);
      const queryString = window.location.search;
      console.log(queryString);
  
      const urlParams = new URLSearchParams(queryString);
      console.log(urlParams)
  
      const prolific_ID = urlParams.get('PROLIFIC_PID')
      console.log(prolific_ID)
      setPID(prolific_ID);

      checkProgress(prolific_ID)
      
      
      // setChartTypeSelected("scatter");
      // setEncodingDisplay(encodings[chartTypeSelected]);
      // setLoadVis(itemBank["item"+currentItem.toString()]["initialize"]["question_vis"])
      // itemBank["status"]["item"+currentItem] = true
      // setBankStatus(itemBank["status"])
      // var item_state = require("./training_set_config/item"+currentItem+"_initialize.json");
      // setCurrentItemState(item_state);
      // console.log(item_state)
      // console.log(itemBank["status"])
    }, [])

// //   var training_set = require("./training_set.json");
// //   console.log(training_set)


//   if (isClient) {
//   // let mark_spec = vl.markPoint()
//   //   .data(data)
//   //   .toSpec()
//   // let mark_spec = require("./rules/I1/I1-14-0.json");
//     // let mark_spec = require("./question_vis/item1.json");
//     // let vis_spec = training_set["item"+currentItem.toString()]["initialize"]["question_vis"]
//     // let vis_json = require(loadVis)
//     // console.log(itemBank["item"+currentItem.toString()])
//     // setLoadVis(itemBank["item"+currentItem.toString()]["initialize"]["question_vis"])
//     // itemBank["status"]["item"+currentItem] = true
//     // setBankStatus(itemBank["status"])
//     // var item_state = require("./training_set_config/item"+currentItem+"_initialize.json");
//     // setCurrentItemState(item_state);
//     // console.log(item_state)
//     // console.log(itemBank["status"])
//     document.getElementById(currentChartType+"_container").classList.add("selectedChart")
//     console.log(loadVis)
//     // let mark_spec = require(training_set["item"+currentItem.toString()]["initialize"]["question_vis"]);
//     embed('#questionVis', loadVis, {"actions": false});
//     if (itemBank[currentItem]["question_meta_data"]["highlight_component"] == "mark") {
//       document.getElementById("chartTypes").classList.add("highlightBackground")
//     } else if (itemBank[currentItem]["question_meta_data"]["highlight_component"] == "data") {
//       document.getElementById("data").classList.add("highlightBackground")
//     } else if (itemBank[currentItem]["question_meta_data"]["highlight_component"] == "transformations") {
//       document.getElementById("transformations").classList.add("highlightBackground")
//     }
//     // console.log(require(mark_spec))
//   }

  

//   let chart_types = Object.keys(tileSets)
//   // let types_list = chart_types.charts_index;
//   // let tile_types = chart_types.types
//   console.log(chart_types)

//   let transformations = tileSets[currentChartType]["transformations"];
//   // let actions_list = transformations.transformation_index;
//   // let action_types = transformations.actions
//   // console.log(action_types)

//   let encodings = tileSets[currentChartType]["encodings"];
//   console.log(encodings)
//   // console.log(chartTypeSelected)
//   // console.log(encodings[chartTypeSelected])

//   let read_dataset = dataset;
//   console.log(read_dataset)
//   let data_columns = Object.keys(read_dataset)
//   console.log(data_columns)
  
//   const changeChartType = (clicked_chart) => {
//     console.log("clicked")
//     console.log(clicked_chart)
//     setChartTypeSelected(clicked_chart);
//     setCurrentChartType(clicked_chart)
//     // setEncodingDisplay(tileSets[clicked_chart]["encodings"]);
//     let vis_update = loadVis
//     updateMark(vis_update, clicked_chart)
//     let chart_tiles = document.getElementsByClassName("chartTilesContainer")
//     console.log(chart_tiles)
//     for (let index = 0; index < chart_tiles.length; index += 1) {
//       if (chart_tiles[index].classList.contains("selectedChart")) {
//         chart_tiles[index].classList.remove("selectedChart");
//       }
//     }
//     document.getElementById(clicked_chart+"_container").classList.add("selectedChart")
//   }

//   // const initiateIndicators = () => {
//   //   let data_inputs = document.getElementsByClassName("inputData")
//   //   console.log(data_inputs)
//   // }


//   const drag = (element) => {
//     console.log("in drag")
//     console.log(element.dataTransfer)
//     console.log(element.target)
    
//     if (element.target.id.includes("data")) {
//       let transformation_inputs = document.getElementsByClassName("inputTransformation")
//       console.log(transformation_inputs)
//       for (let index = 0; index < transformation_inputs.length; index += 1) {
//         console.log(transformation_inputs[index].innerHTML)
//         transformation_inputs[index].classList.remove("tileMovableSpace");
//         transformation_inputs[index].classList.add("tileMoved")
//         // highlight empty input spaces
//         // if (data_inputs[index].innerHTML == "") {
//         //   data_inputs[index].classList.add("dataMovableSpace")
//         // }
//       }
//       let data_inputs = document.getElementsByClassName("inputData")
//       console.log(data_inputs)
//       for (let index = 0; index < data_inputs.length; index += 1) {
//         console.log("moveable???")
//         console.log(data_inputs[index].innerHTML)
//         data_inputs[index].classList.remove("tileMoved")
//         // highlight empty input spaces
//         if (data_inputs[index].innerHTML == "") {
//           data_inputs[index].classList.add("tileMovableSpace")
//         }
//       }
//     } else if (element.target.id.includes("transformation")) {
//       let data_inputs = document.getElementsByClassName("inputData")
//       console.log(data_inputs)
//       for (let index = 0; index < data_inputs.length; index += 1) {
//         console.log(data_inputs[index].innerHTML)
//         data_inputs[index].classList.remove("tileMovableSpace");
//         data_inputs[index].classList.add("tileMoved")
//         // highlight empty input spaces
//         // if (data_inputs[index].innerHTML == "") {
//         //   data_inputs[index].classList.add("dataMovableSpace")
//         // }
//       }
//       let transformation_inputs = document.getElementsByClassName("inputTransformation")
//       console.log(transformation_inputs)
//       for (let index = 0; index < transformation_inputs.length; index += 1) {
//         console.log("moveable???")
//         console.log(transformation_inputs[index].innerHTML)
//         transformation_inputs[index].classList.remove("tileMoved")
//         // highlight empty input spaces
//         if (transformation_inputs[index].innerHTML == "") {
//           transformation_inputs[index].classList.add("tileMovableSpace")
//         }
//       }
//     }
    
//     // let element_id = element.target.id.split("-")
//     // if (element_id.length == 3) {
//     //   element.target.id = "redrag+"+element_id[0] + "-" + element_id[1]
//     // }
//     // let transfer_id = element.target.id
//     // // dragging from input area
//     // if (element.target.id.includes("input")) {
//     //   transfer_id = element.target.firstChild.id
//     // }
//     element.dataTransfer.setData("text", element.target.id);
//     // setDraggedTile(element.target);
//     // element.dataTransfer.setData("text", "");
//   }

//   const allowDrop = (ev) => {
//     // if (draggedTile) {
//       ev.preventDefault();
//       ev.dataTransfer.dropEffect = "move";
//     // }
    
//   }

//   const dataDrop = (ev) => {
//     ev.preventDefault();
//     console.log("in drop")
//     console.log(ev.target)
//     // console.log(ev.target.getAttribute('data-draggable'))
//     var data = ev.dataTransfer.getData("text");
    
//     console.log(data)
//     console.log(ev.dataTransfer)
//     if (data.includes("data") && ev.target.getAttribute('data-draggable') == "target") {
//       // if dragged tile to border and input has content
//       if (ev.target.innerHTML != "") {
//         dataOverwrite(ev);
//       } else {
//         console.log("dropping!")
//         let dragged_element_id = data; // save id of the dragged tile
//         let element_id = data.split("-")
//         console.log(element_id)
//         // if the tile has been dragged before (encoding is in id already)
//         if (element_id.length == 3) {
//           let remove_from_encoding = element_id[2];
//           removeDataEncoding(loadVis, remove_from_encoding, element_id[1]) // remove encoding mapping from previous spot
//           data = "redrag+"+element_id[0] + "-" + element_id[1]
//         }
//         // ev.target.appendChild(draggedTile); // todo try not using setstate, and append by id?
//         let drop_container = ev.target;
//         drop_container.innerHTML = "";
//         if (data.includes("redrag")) {
//           console.log(document.getElementById(data))
//           drop_container.appendChild(document.getElementById(dragged_element_id)); // move instead of clone
//           data = data.split("+")[1];
//           drop_container.firstChild.id = data // reset id to not include "redrag" tag
//         } else {
//           drop_container.appendChild(document.getElementById(data).cloneNode(true));
//         }
//         console.log(drop_container.firstChild)
//         let add_data = data.split("-")[1]
//         let find_encoding = drop_container.nextSibling.firstChild.id.split("-")[1] // TODO fix; check have an unique separator
//         drop_container.firstChild.id += "-";
//         drop_container.firstChild.id += find_encoding;
//         console.log(find_encoding)
//         let vis_update = loadVis
//         let updated_spec = updateEncodingMapping(vis_update, find_encoding, add_data, dataset);
//         console.log(updated_spec)
//         console.log(loadVis)
//         // if (find_encoding.includes("color")) {
//         //   vis_update["encoding"][find_encoding.split("_")[1]] = {"field": add_data, "type": "nominal"}; // TODO need a dictionary for looking up each data column type
//         // }
        
//         // console.log(vis_update)
//         setLoadVis(updated_spec)
//         let data_inputs = document.getElementsByClassName("inputData")
//         console.log(data_inputs)
//         for (let index = 0; index < data_inputs.length; index += 1) {
//           console.log(data_inputs[index].innerHTML)
//           data_inputs[index].classList.remove("tileMovableSpace");
//           data_inputs[index].classList.add("tileMoved")
//           // highlight empty input spaces
//           // if (data_inputs[index].innerHTML == "") {
//           //   data_inputs[index].classList.add("dataMovableSpace")
//           // }
//         }
//       }
//       // console.log(loadVis)
//       // embed('#questionVis', loadVis, {"actions": false});
//       // let state_change = currentItemState
      
//       // for (var [key, value] of Object.entries(currentItemState)) {
//       //   // console.log(key, value);
        
//       //   // console.log(extract_data)
//       //   console.log(value["data"])
//       //   // TODO: fix this portion
//       //   if (key == "seq_color" || key == "div_color") {
//       //       // let extract_encoding = key.split("_")[0];
//       //       // console.log(extract_encoding)
//       //       vis_update["encoding"]["color"] = {"field": add_data}
//       //   }
          
      
//       //   }
//       // }
//       // setCurrentItemState(state_change)
//       // ev.preventDefault();
//     } else if (data.includes("data") && ev.target.getAttribute('data-draggable').includes("overwrite")) {
//       dataOverwrite(ev);
//     }
//     // if (data.includes("data")) {
//     //   
//     // }
    
//   }

//   const dataOverwrite = (ev) => {
//     ev.preventDefault();
//     console.log("in data overwrite!!")
//     console.log(ev.target.id)
//     console.log(ev.target.getAttribute('data-draggable'))
//     // dragged tile to border
//     if (ev.target.getAttribute('data-draggable') == "target" && ev.target.innerHTML != "") {
//       ev.target = ev.target.firstChild // overwrite tile content if any
//     }
//     if (ev.target.getAttribute('data-draggable') == "overwrite-parent") {
//       ev.target = ev.target.parentNode
//     }
//     let overwriting_space = ev.target.parentNode
//     console.log(overwriting_space)
//     let overwriting = ev.target.id.split("-")
//     var new_data = ev.dataTransfer.getData("text");
//     let new_data_split = new_data.split("-")
//     console.log(new_data)
//     // let drop_container = ev.target;
//     if (ev.target.id != new_data) {
//       if (overwriting_space && document.getElementById(new_data) && overwriting.length == 3 && new_data_split[0] == "data") {
//         overwriting_space.innerHTML = "";
//         if (new_data_split.length == 3) {
//           removeDataEncoding(loadVis, new_data_split[2], new_data_split[1]) // remove encoding mapping from previous spot
//           overwriting_space.appendChild(document.getElementById(new_data)); // move instead of clone
//         } else {
//           overwriting_space.appendChild(document.getElementById(new_data).cloneNode(true)); // from original set so need to clone
//         }
//         removeDataEncoding(loadVis, overwriting[2], overwriting[1]) // remove encoding mapping from previous spot
//         updateEncodingMapping(loadVis, overwriting[2], new_data_split[1], dataset);
        
//         overwriting_space.firstChild.id = new_data_split[0] + "-" + new_data_split[1]
//         overwriting_space.firstChild.id += "-";
//         overwriting_space.firstChild.id += overwriting[2];
//         console.log(overwriting_space.firstChild.id) // todo fix
//         let data_inputs = document.getElementsByClassName("inputData")
//           console.log(data_inputs)
//           for (let index = 0; index < data_inputs.length; index += 1) {
//             console.log(data_inputs[index].innerHTML)
//             data_inputs[index].classList.remove("tileMovableSpace");
//             data_inputs[index].classList.add("tileMoved")
//             // highlight empty input spaces
//             // if (data_inputs[index].innerHTML == "") {
//             //   data_inputs[index].classList.add("dataMovableSpace")
//             // }
//           }
//       }
//     }
    
//   }

//   const transformationDrop = (ev) => {
//     ev.preventDefault();
//     console.log("in transformation drop")
//     console.log(ev.target)
//     // console.log(ev.target.getAttribute('data-draggable'))
//     var data = ev.dataTransfer.getData("text");
//     console.log(data)
//     if (data.includes("transformation") && ev.target.getAttribute('data-draggable') == "transformation_target") {
//       // if dragged tile to border and input has content
//       if (ev.target.innerHTML != "") {
//         transformationOverwrite(ev);
//       } else {
//         console.log("dropping transformation!")
//         let dragged_element_id = data; // save id of the dragged tile
//         let element_id = data.split("-")
//         console.log(element_id)
//         console.log(data)
//         // if the tile has been dragged before (encoding is in id already)
//         if (element_id.length == 3) {
//           let remove_from_encoding = element_id[2];
//           removeTransformationEncoding(loadVis, remove_from_encoding, element_id[1]) // remove encoding mapping from previous spot
//           data = "redrag+"+element_id[0] + "-" + element_id[1]
//         }
//         // ev.target.appendChild(draggedTile); // todo try not using setstate, and append by id?
//         let drop_container = ev.target;
//         drop_container.innerHTML = "";
//         if (data.includes("redrag")) {
//           console.log(document.getElementById(data))
//           drop_container.appendChild(document.getElementById(dragged_element_id)); // move instead of clone
//           data = data.split("+")[1];
//           drop_container.firstChild.id = data // reset id to not include "redrag" tag
//         } else {
//           drop_container.appendChild(document.getElementById(data).cloneNode(true));
//         }
//         let add_transformation = data.split("-")[1]
//         console.log(drop_container)
//         let find_transformation_encoding = drop_container.previousSibling.firstChild.id.split("-")[1]
//         drop_container.firstChild.id += "-";
//         drop_container.firstChild.id += find_transformation_encoding;
//         let vis_update = loadVis
//         let updated_spec = updateTransformationMapping(vis_update, find_transformation_encoding, add_transformation, dataset);
//         // let extract_transformation_encoding = find_transformation_encoding
//         // if (find_transformation_encoding.includes("color")) {
//         //   extract_transformation_encoding = find_transformation_encoding.split("_")[1];
//         //   // vis_update["encoding"][find_transformation_encoding.split("_")[1]]["aggregation"] = add_transformation; // TODO need a dictionary for looking up each data column type and where the transformaiton should be
//         // } else if (find_transformation_encoding.includes("axis")) {
//         //   extract_transformation_encoding = find_transformation_encoding.split("_")[0];
//         //   // vis_update["encoding"][find_transformation_encoding.split("_")[0]] = {"field": add_transformation, "type": "nominal"}; // TODO need a dictionary for looking up each data column type
//         // }
//         // vis_update["encoding"][extract_transformation_encoding]["aggregate"] = add_transformation; // TODO need a dictionary for looking up each data column type and where the transformaiton should be
//         // ev.preventDefault();
//         console.log(updated_spec)
//         setLoadVis(updated_spec)
//         let transformation_inputs = document.getElementsByClassName("inputTransformation")
//         console.log(transformation_inputs)
//         for (let index = 0; index < transformation_inputs.length; index += 1) {
//           console.log(transformation_inputs[index].innerHTML)
//           transformation_inputs[index].classList.remove("tileMovableSpace");
//           transformation_inputs[index].classList.add("tileMoved")
//           // highlight empty input spaces
//           // if (data_inputs[index].innerHTML == "") {
//           //   data_inputs[index].classList.add("dataMovableSpace")
//           // }
//         }
//       }
//       // console.log(loadVis)
//       // embed('#questionVis', loadVis, {"actions": false});
//     } else if (data.includes("transformation") && ev.target.getAttribute('data-draggable') == "overwrite") {
//       transformationOverwrite(ev);
//     }
//     // if (data.includes("data")) {
//     //   
//     // }
    
//   }

//   const transformationOverwrite = (ev) => {
//     ev.preventDefault();
//     console.log("in transformation overwrite!!")
//     console.log(ev.target.id)
//     // dragged tile to border
//     if (ev.target.getAttribute('data-draggable') == "transformation_target" && ev.target.innerHTML != "") {
//       ev.target = ev.target.firstChild // overwrite tile content if any
//     }
//     let overwriting_space = ev.target.parentNode
//     console.log(overwriting_space)
//     let overwriting = ev.target.id.split("-")
//     console.log(overwriting)
//     var new_transformation = ev.dataTransfer.getData("text");
//     let new_transformation_split = new_transformation.split("-")
//     console.log(new_transformation)
//     // let drop_container = ev.target;
//     if (ev.target.id != new_transformation) {
//       if (overwriting_space && document.getElementById(new_transformation) && overwriting.length == 3 && new_transformation_split[0] == "transformation") {
//         ev.target.parentNode.innerHTML = "";
//         if (new_transformation_split.length == 3) {
//           removeTransformationEncoding(loadVis, new_transformation_split[2], new_transformation_split[1]) // remove encoding mapping from previous spot
//           overwriting_space.appendChild(document.getElementById(new_transformation)); // move instead of clone
//         } else {
//           overwriting_space.appendChild(document.getElementById(new_transformation).cloneNode(true)); // from original set so need to clone
//         }
//         removeTransformationEncoding(loadVis, overwriting[2], overwriting[1]) // remove encoding mapping from previous spot
//         updateTransformationMapping(loadVis, overwriting[2], new_transformation_split[1], dataset);
//         overwriting_space.firstChild.id = new_transformation_split[0] + "-" + new_transformation_split[1]
//         overwriting_space.firstChild.id += "-";
//         overwriting_space.firstChild.id += overwriting[2];
//         console.log(overwriting_space.firstChild.id) // todo fix
//         let transformation_inputs = document.getElementsByClassName("inputTransformation")
//         console.log(transformation_inputs)
//         for (let index = 0; index < transformation_inputs.length; index += 1) {
//           console.log(transformation_inputs[index].innerHTML)
//           transformation_inputs[index].classList.remove("tileMovableSpace");
//           transformation_inputs[index].classList.add("tileMoved")
//           // highlight empty input spaces
//           // if (data_inputs[index].innerHTML == "") {
//           //   data_inputs[index].classList.add("dataMovableSpace")
//           // }
//         }
//         // console.log(loadVis)
//         // embed('#questionVis', loadVis, {"actions": false});
        
//       }
//     }
//   }

//   const removeDataTile = (ev) => {
//     console.log("in click")
//     console.log(ev.target)
//     console.log(ev.target.id)
//     console.log(loadVis)
//     console.log(currentItemState)
//     if (ev.target.id.includes("data")) {
//       let state_change = currentItemState
//       let vis_update = loadVis
//       let mapping_info = ev.target.id.split("-")
//       removeDataEncoding(vis_update, mapping_info[2], mapping_info[1])
//       // for (var [key, value] of Object.entries(currentItemState)) {
//       //   // console.log(key, value);
//       //   let extract_data = ev.target.id.split("-")[1]
//       //   // console.log(extract_data)
//       //   console.log(value["data"])
//       //   if (value["data"] == extract_data) {
//       //     console.log(key)
//       //     // TODO: fix this portion
//       //     if (key == "x_axis" || key == "y_axis") {
//       //       let extract_encoding = key.split("_")[0];
//       //       console.log(extract_encoding)
//       //       vis_update["encoding"][extract_encoding] = ""
//       //     } else {
//       //       vis_update["encoding"][key] = ""
//       //     }
          
//       //     state_change[key]["data"] = ""
//       //   }
//       // }
//       setLoadVis(vis_update);
//       // setCurrentItemState(state_change)
//       // embed('#questionVis', loadVis, {"actions": false});
//       // console.log(vis_update)
//       // console.log(ev.target.parentNode)
//       ev.target.parentNode.innerHTML = "";
//     }
//   }

//   const dragOff = (ev) => {
//     console.log("in dragOff!")
//     console.log(ev.target)
//     var data = ev.dataTransfer.getData("text");
//     console.log(data)
//     let tile_parentNode = document.getElementById(data)
//     if (document.getElementById(data)) {
//       tile_parentNode = document.getElementById(data).parentNode
//     }
    
//     console.log(tile_parentNode)
//     if (data.split("-").length == 3 && ev.target.getAttribute('data-draggable') == "removing") {
//       if (data.includes("data")) {
//         let state_change = currentItemState
//         let vis_update = loadVis
//         let mapping_info = data.split("-")
//         removeDataEncoding(vis_update, mapping_info[2], mapping_info[1])
//         setLoadVis(vis_update);
//         // setCurrentItemState(state_change)
//         // embed('#questionVis', loadVis, {"actions": false});
//         // console.log(vis_update)
//         // console.log(ev.target.parentNode)
//         // ev.target.parentNode.innerHTML = "";
//         console.log(tile_parentNode)
//         if (tile_parentNode) {
//           tile_parentNode.innerHTML = "";
//         }
        
//         let data_inputs = document.getElementsByClassName("inputData")
//         console.log(data_inputs)
//         for (let index = 0; index < data_inputs.length; index += 1) {
//           console.log(data_inputs[index].innerHTML)
//           data_inputs[index].classList.remove("tileMovableSpace");
//           data_inputs[index].classList.add("tileMoved")
//           // highlight empty input spaces
//           // if (data_inputs[index].innerHTML == "") {
//           //   data_inputs[index].classList.add("dataMovableSpace")
//           // }
//         }
//       } else if (data.includes("transformation")) {
//         let state_change = currentItemState
//         let vis_update = loadVis
//         let mapping_info = data.split("-")
//         removeTransformationEncoding(vis_update, mapping_info[2], mapping_info[1]);
//         setLoadVis(vis_update);
//         // setCurrentItemState(state_change)
//         // embed('#questionVis', loadVis, {"actions": false});
//         // console.log(vis_update)
//         // console.log(state_change)
//         // console.log(ev.target.parentNode)
//         // ev.target.parentNode.innerHTML = "";
//         if (tile_parentNode) {
//           tile_parentNode.innerHTML = "";
//         }
//         let transformation_inputs = document.getElementsByClassName("inputTransformation")
//         console.log(transformation_inputs)
//         for (let index = 0; index < transformation_inputs.length; index += 1) {
//           console.log(transformation_inputs[index].innerHTML)
//           transformation_inputs[index].classList.remove("tileMovableSpace");
//           transformation_inputs[index].classList.add("tileMoved")
//           // highlight empty input spaces
//           // if (data_inputs[index].innerHTML == "") {
//           //   data_inputs[index].classList.add("dataMovableSpace")
//           // }
//         }
//       }
//     }
    
//   }

//   const removeTransformationTile =(ev) => {
//     console.log("in transformation click")
//     console.log(ev.target.id)
//     console.log(loadVis)
//     console.log(currentItemState)
//     if (ev.target.id.includes("transformation")) {
//       let state_change = currentItemState
//       let vis_update = loadVis
//       let mapping_info = ev.target.id.split("-")
//       removeTransformationEncoding(vis_update, mapping_info[2], mapping_info[1]);
//       // for (var [key, value] of Object.entries(currentItemState)) {
//       //   // console.log(key, value);
//       //   let extract_transformation = ev.target.id.split("-")[1]
//       //   // console.log(extract_data)
//       //   console.log(value["transformation"])
//       //   if (value["transformation"] == extract_transformation) {
//       //     console.log(key)
//       //     // TODO: fix this portion
//       //     console.log(ev.target.parentNode.previousSibling.firstChild.id)
//       //     let corresponding_encoding = ev.target.parentNode.previousSibling.firstChild.id.split("-")[1]
//       //     // let extract_encoding = key.split("_")[0];
//       //     // console.log(extract_encoding)
//       //     if (key == corresponding_encoding) {
//       //       if (key == "x_axis" || key == "y_axis") {
//       //         console.log("deleting for"+key.split("_")[0])
//       //         delete vis_update["encoding"][key.split("_")[0]]["aggregate"]
//       //         state_change[key]["transformation"] = ""
//       //       } else {
//       //         vis_update["encoding"][key]["aggregate"] = ""
//       //       }
              
//       //     }
          
          
//       //   }
//       // }
//       setLoadVis(vis_update);
//       // setCurrentItemState(state_change)
//       // embed('#questionVis', loadVis, {"actions": false});
//       // console.log(vis_update)
//       // console.log(state_change)
//       // console.log(ev.target.parentNode)
//       ev.target.parentNode.innerHTML = "";
//     }
//   }

//   const opacityChange = (ev) => {
//     console.log("in hover opacity")
//     console.log(ev.target.id)
//     let check_mapped = ev.target.id.split("-")
//     if (check_mapped.length == 3) {
//       document.getElementById(ev.target.id).classList.remove("removeMouseOut")
//       document.getElementById(ev.target.id).classList.add("removeMouseOver");
//     }
    
//   }

//   const restoreOpacity = (ev) => {
//     console.log("in hover opacity")
//     console.log(ev.target.id)
//     let check_mapped = ev.target.id.split("-")
//     if (check_mapped.length == 3) {
//       document.getElementById(ev.target.id).classList.add("removeMouseOut")
//       document.getElementById(ev.target.id).classList.remove("removeMouseOver");
//     }
    
//   }

//   const displayDescription = (for_data) => {
//     console.log("in display descriptions for data!")
//     console.log(for_data)
//     document.getElementById("descriptionTitle").classList.remove("hideDescription")
//     document.getElementById(for_data+"_description").classList.add("showDescription")
//     document.getElementById(for_data+"_description").classList.remove("hideDescription")

//     // document.getElementById("encodings").classList.add("marginLeft")
//     // document.getElementById("data").classList.add("marginRight")
//   }

//   const removeDescription = (for_data) => {
//     console.log("in remove descriptions for data!")
//     console.log(for_data)
//     document.getElementById("descriptionTitle").classList.add("hideDescription")
//     // document.getElementById(for_data+"_description").classList.add("showDescription")
//     document.getElementById(for_data+"_description").classList.add("hideDescription")
//   }

  const nextItem = (e) => {
    
    console.log("clicking next")
    let current_item = props.item;
    let next_item = current_item + 1
    console.log(next_item)
    document.getElementById("proceeding").classList.remove("hideDescription")
    updateProgress(pID, "instructions")
    let url_pid = "?PROLIFIC_PID=" + pID;
    router.push('/Q1'+url_pid)

    // if (next_item > 100 && next_item <= 103) {
    // //   setCurrentItem(next_item);
    // //   setLoadVis(itemBank["item"+next_item.toString()]["initialize"]["question_vis"])
    // //   console.log(document.getElementsByClassName("inputSpace"))
    //   // let to_clear = document.getElementsByClassName("inputSpace")
    //   // for (let i = 0; i < to_clear.length; i += 1) {
    //   //   to_clear[i].innerHTML = "<p></p>";
    //   // }

    //   // var current_item_state = require("./training_set_config/item"+current_item+"_initialize.json");
    //   // setCurrentItemState(current_item_state);
    //   // let clear_state = currentItemState
    //   // for (var [key, value] of Object.entries(currentItemState)) {
    //   //   // console.log(key, value);
    //   //   if (value["data"]) {

    //   //   }
    //   //   clear_state[key]["data"] = "";
    //   //   clear_state[key]["transformation"] = "";
    //   //   // let extract_data = ev.target.id.split("_")[1]
    //   //   // // console.log(extract_data)
    //   //   // console.log(value["data"])
    //   //   // if (value["data"] == extract_data) {
    //   //   //   console.log(key)
    //   //   //   // TODO: fix this portion
    //   //   //   if (key == "x_axis" || key == "y_axis") {
    //   //   //     let extract_encoding = key.split("_")[0];
    //   //   //     console.log(extract_encoding)
    //   //   //     vis_update["encoding"][extract_encoding] = ""
    //   //   //   } else {
    //   //   //     vis_update["encoding"][key] = ""
    //   //   //   }
          
    //   //   //   state_change[key]["data"] = ""
    //   //   }
    //   //   setCurrentItemState(clear_state);      

    // //   var next_item_state = require("./training_set_config/item"+next_item+"_initialize.json");
    // //   setCurrentItemState(next_item_state);
    // //   itemBank["status"]["item"+next_item] = true
    // //   setBankStatus(itemBank["status"])
    // //   console.log(currentItemState)
    // //   console.log(itemBank["status"])
    //   let text_answer = document.getElementById("questionAnswer").value
    //   console.log(text_answer)
    //   if (text_answer) {
    //     // handleSubmit(e, "item_"+current_item, startTime, text_answer)
    //     let url_pid = "?PROLIFIC_PID=" + pID;
    //     router.push('/start'+next_item+url_pid)
    //   }
      
    // } else {
    // //   let text_answer = document.getElementById("questionAnswer").value
    // //   console.log(text_answer)
    // //   if (text_answer) {
    //     // handleSubmit(e, "item_"+current_item, startTime, text_answer)
    //     let url_pid = "?PROLIFIC_PID=" + pID;
    //     router.push('/Q1'+url_pid)
    // //   }
    // }
    

    // write to DB and reset [necessary/written variables]
  }
  // document.getElementById('exportText').addEventListener('click', function() {
  //   console.log(document.getElementById('yourname').value)
  // })


  // const queryString = window.location.search;
  // console.log(queryString);

  // const urlParams = new URLSearchParams(queryString);
  // console.log(urlParams)

  // const prolificID = urlParams.get('PROLIFIC_PID')
  // console.log(prolificID)

  // // setup API options
  // const options = {
  //   config: {
  //     // Vega-Lite default configuration
  //   },
  //   init: (view) => {
  //     // initialize tooltip handler
  //     view.tooltip(new vegaTooltip.Handler().call);
  //   },
  //   view: {
  //     // view constructor options
  //     // remove the loader if you don't want to default to vega-datasets!
  //     // loader: vega.loader({
  //     //   baseURL: "https://cdn.jsdelivr.net/npm/vega-datasets@2/",
  //     // }),
  //     renderer: "canvas",
  //   },
  // };
  

  // useEffect(() => {
  //   setIsClient(true)
    
    
  //   // register vega and vega-lite with the API
  //   // vl.register(vega, vegaLite, options);
  //   // console.log(data["data"]["values"][0])
    
  //   // console.log(mark_spec)
  //   // // .then(viewElement => {
  //   // //   // render returns a promise to a DOM element containing the chart
  //   // //   // viewElement.value contains the Vega View object instance
  //   // //   document.getElementById('view').appendChild(viewElement);
  //   // // });
  //   // embed('#vis', mark_spec);

  // }, [])

  // let data = require('./data.json') // import vega_datasets
  // let mark_spec = vl.markPoint()
  //     .data(data)
  //     .size("")
  //     .toSpec()

  // // mark_spec_update = mark_spec.size("")
  // console.log(mark_spec)

  // if (isClient) {
  //   // let mark_spec = vl.markPoint()
  //   //   .data(data)
  //   //   .toSpec()
  //   // let mark_spec = require("./rules/I1/I1-14-0.json");
  //   // embed('#vis', mark_spec, {"actions": false});
  //   let chart_types = {};
  //   fetch('./tiles/chart-types.json')
  //       .then((res) => {
  //           if (!res.ok) {
  //               throw new Error
  //                   (`HTTP error! Status: ${res.status}`);
  //           }
  //           return res.json();
  //       })
  //       .then((data) => {
  //           console.log(data);
  //           chart_types = data
  //       })
  //       .catch((error) => 
  //           console.error("Unable to fetch data:", error));
    
  //   console.log(chart_types)
  // }
  
  
  
  // console.log(JSON.stringify(mark_spec))
  // var fs = require('fs');
  // fs.writeFile("vis_spec.json", mark_spec, function(err) {
  //     if (err) {
  //         console.log(err);
  //     }
  // });
 

  // var yourVlSpec = {
  //   $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  //   description: 'A simple bar chart with embedded data.',
  //   data: {
  //     values: [
  //       {a: 'A', b: 28},
  //       {a: 'B', b: 55},
  //       {a: 'C', b: 43},
  //       {a: 'D', b: 91},
  //       {a: 'E', b: 81},
  //       {a: 'F', b: 53},
  //       {a: 'G', b: 19},
  //       {a: 'H', b: 87},
  //       {a: 'I', b: 52}
  //     ]
  //   },
  //   mark: 'bar',
  //   encoding: {
  //     x: {field: 'a', type: 'ordinal'},
  //     y: {field: 'b', type: 'quantitative'}
  //   }
  // };
  // var moreSpecificSpec = require("./visSpec.json");
  
  const redirecting = () => {
    // router.push(redirectTo)
    // location.href = redirectTo
    router.push(redirectTo)
  }

  return (
    <div>
        {loading ? null  :
            (redirectTo != "") ? 
            (redirecting()) : <div id='questionContainer'>
                <h3>Instructions for Main Section</h3>
                <br></br>
                <p><b>You are now about to begin the main section.</b></p>
                <p>The layout of each question in this section will be the same as the training you just completed.</p>
                <p>In each question, you will be asked to create a chart that supports or negates a given statement.</p>
                <p>The given data for each question may be different, but they will all involve the following variables.</p>
                
                <h4><b>Please familiarize yourself with these variables before clicking start.</b></h4>
                <hr></hr>
                <p><b>Date:</b> A recorded date (year-month-date) to track daily spendings, income, or savings.</p>
                <p><b>Month:</b> The month.</p>
                <p><b>Year:</b> The year.</p>
                <p><b>Spending:</b> The amount of spending in each recorded date in dollars.</p>
                <p><b>Income:</b> The amount of income in each recorded date in dollars.</p>
                <p><b>Savings:</b> The amount of savings in each recorded date in dollars.</p>
                <p><b>Spending_Category:</b> What the spending was categorized as.</p>
                <hr></hr>
                <br></br>
                <p>There are <b>15 questions</b> in this section.</p>
                <p>This section is expected to take approximately 25 minutes.</p>
                {/* <p>{itemBank[currentItem]["question_meta_data"]["question_text"]}</p> */}
                <p>For successful completion, you must answer all of the questions in this section.</p>
                <br></br>
                <p><i>Note you will not be able to go back once you advance to the next question.</i></p>
                <p>Click 'Start' to proceed.</p>
                <div id="nextButton" style={{marginBottom:"6rem"}} onClick={(e) => nextItem(e)}>
                  <p>Start</p>
                </div>
                <p id='proceeding' className='hideDescription'>Proceeding...</p>
            </div>}
        {/* <div id='visContainer'>
            <div id="questionVis"></div>
            <div id="answerVis">
              <p><label htmlFor="questionAnswer">Enter your answer to the question below <span style={{color:"red"}}>*</span>:</label></p>
              <textarea id="questionAnswer" name="questionAnswer" rows="2" cols="35"></textarea>
            </div>
        </div>
        <div id='tilesContainer'>
          <div id='chartTypes'>
            <p>Marks</p>
            <div>
              {chart_types.map(chart_tiles => (
                  <div className="chartTilesContainer" key={chart_tiles} id={chart_tiles+"_container"}>
                      <img className="chartTiles" src={tileSets[chart_tiles]["chart"]} onClick={() => changeChartType(chart_tiles)}></img>
                  </div>
              ))}
            </div>
          </div>
          <div id='mappingZone' data-draggable="removing" onDrop={(event) => dragOff(event)} onDragOver={(event) => allowDrop(event)}>
              <div id='data'>
                <p>Data</p>
                {data_columns.map(variable => (
                    <div key={variable} className="dataTileContainer">
                      <div className="dataTiles" id={"data-"+variable} onMouseOver={() => displayDescription(variable)} onMouseLeave={() => removeDescription(variable)} draggable="true" onDragStart={(event) => drag(event)} data-draggable="overwrite" onDrop={(event) => dataOverwrite(event)} onDragOver={(event) => allowDrop(event)}><p data-draggable="overwrite-parent" onDrop={(event) => dataOverwrite(event)} onDragOver={(event) => allowDrop(event)}>{variable}</p></div>
                    </div>
                  ))}
              </div>
              <div className="" id="metaDataColumn">
                <p className="hideDescription" id="descriptionTitle">Description</p>
                {data_columns.map(variable => (
                    <div key={variable} className="dataDescriptionsContainer" data-draggable="removing" onDrop={(event) => dragOff(event)} onDragOver={(event) => allowDrop(event)}>
                      <p className="hideDescription dataDescriptions" id={variable+"_description"}>
                        <b>{dataset[variable]["full_name"]}</b>
                        <br />
                        <span>{dataset[variable]["description"]}</span>
                      </p>
                    </div>
                  ))}
              </div>
            <div id='encodings'>
                <p>Encodings</p>
                <div>
                  { Object.entries(encodings).map((encoding_icon, index) => (
                    <div className='mappingContainer' key={"mapping-"+index}>
                      <div className='inputSpace inputData' key={"input-"+index} data-draggable="target" onDrop={(event) => dataDrop(event)} onDragOver={(event) => allowDrop(event)} draggable="true" onDragStart={(event) => drag(event)}>
                        { Object.entries(currentItemState["encodings"]).map((data_mapping, index) => (
                          (data_mapping[0] == encoding_icon[0] && data_mapping[1]["data"]) ? 
                            <div key={"fill-data-"+index} className="dataTiles" id={"data-"+data_mapping[1]["data"]+"-"+encoding_icon[0]} draggable="true" onDragStart={(event) => drag(event)} data-draggable="overwrite" onDrop={(event) => dataOverwrite(event)} onDragOver={(event) => allowDrop(event)}><p data-draggable="overwrite-parent" onDrop={(event) => dataOverwrite(event)} onDragOver={(event) => allowDrop(event)}>{data_mapping[1]["data"]}</p></div>
                          : null
                          ))}
                      </div>
                      <div className='staticColumn' key={index}>
                        <img id={"encoding-"+encoding_icon[0]} src={encoding_icon[1]}></img>
                      </div>
                      <div className='inputSpace inputTransformation' key={"input-transform"+index} data-draggable="transformation_target" onDrop={(event) => transformationDrop(event)} onDragOver={(event) => allowDrop(event)} draggable="true" onDragStart={(event) => drag(event)}>
                      { Object.entries(currentItemState["encodings"]).map((data_mapping, index) => (
                          (data_mapping[0] == encoding_icon[0] && data_mapping[1]["transformation"]) ? 
                            <img key={"fill-transformation-"+index} src={transformations[data_mapping[1]["transformation"]]} id={"transformation-"+data_mapping[1]["transformation"]+"-"+encoding_icon[0]} className="transformationTiles" draggable="true" onDragStart={(event) => drag(event)} data-draggable="overwrite" onDrop={(event) => transformationOverwrite(event)} onDragOver={(event) => allowDrop(event)}></img>
                          : null
                          ))}
                      </div>
                    </div>
                  ))}
                  
                </div>

              </div>
              <div id='transformations'>
                <p>Transformations</p>
                <div>
                  {Object.entries(transformations).map((transformation_tiles, index) => (
                    noTransformationDisplay.includes(transformation_tiles[0]) ? null :
                    <div key={"action"+index} >
                      <img  src={transformation_tiles[1]} id={"transformation-"+transformation_tiles[0]} className="transformationTiles" draggable="true" onDragStart={(event) => drag(event)} data-draggable="overwrite" onDrop={(event) => transformationOverwrite(event)} onDragOver={(event) => allowDrop(event)}></img>
                    </div>
                  ))}
                  
                </div>
              </div>
          </div>
        </div> */}
      {/* <div id="nextButton" onClick={(e) => nextItem(e)}>
        <p>Start</p>
      </div>
      <p id='proceeding' className='hideDescription'>Proceeding...</p> */}
      {/*<form onSubmit={handleSubmit}>
         <div>
          <label htmlFor='PID'>
            PID:
          </label>
          <input 
          type='text'
          id='PID'
          value={PID}
          onChange={(e) => setPID(e.target.value)}
          />

        </div> 
        <div>
          <label htmlFor='score'>
            Score:
          </label>
          <input 
          type='text'
          id='score'
          value={score}
          onChange={(e) => setScore(e.target.value)}
          />

        </div>
        <div>
          <button type='submit'>
            Submit
          </button>
        </div>
      </form>*/}
    </div>

  );
}

export default FinalInstructions;
