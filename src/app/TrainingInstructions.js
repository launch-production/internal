'use client'
import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { db } from './firebaseConfig';
import { doc, collection, addDoc, updateDoc, setDoc, serverTimestamp, getDocs} from "firebase/firestore";

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

const TrainingInstructions = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isClient, setIsClient] = useState(false);
    const [pID, setPID] = useState("");
    const [currentProgress, setCurrentProgress] = useState({})
    const [redirectTo, setRedirectTo] = useState("")
    const [loading, setLoading] = useState(true);

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

    // console.log(question.question)
    const nextItem = (e) => {
    
        console.log("clicking next")
        document.getElementById("proceeding").classList.remove("hideDescription")
        updateProgress(pID, "training")
        let url_pid = "?PROLIFIC_PID=" + pID;
        router.push('/start101'+url_pid)
        // let current_item = props.item;
        // let next_item = current_item + 1
        // console.log(next_item)
        // if (next_item > 100 && next_item <= 103) {
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
            <div>
                <h3>Instructions for Training Section</h3>
                <br></br>
                <p><b>You are about to begin the training section.</b></p>
                <p>There are <b>5 questions</b> in this section followed by a short survey.</p>
                <p>This section is expected to take approximately 5 minutes.</p>
                <p>For successsful completion, you must answer all of the questions in this section.</p>
                <br></br>
                <p><i>Note you will not be able to go back once you advance to the next question.</i></p>
                <p>Click 'Start Training' to proceed.</p>
            </div>
            <div id="nextButton" onClick={(e) => nextItem(e)}>
                <p>Start Training</p>
            </div>
            <p id='proceeding' className='hideDescription'>Proceeding...</p>
            </div> }

        </div>
        
        
    );
  };
  
  export default TrainingInstructions;