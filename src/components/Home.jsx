import React from "react";
import {Redirect, Link} from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import Grid from "@material-ui/core/Grid"
import {FaceClient, FaceModels} from "@azure/cognitiveservices-face";
import {cognitiveServicesCredentials} from "@azure/ms-rest-js";
import Button from "@material-ui/core/Button"
import {ImagePicker, FilePicker} from "react-file-picker"
import TextField from "@material-ui/core/TextField"
import {db, auth} from "../base";

import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";
import logo from "../logo/Memori_rogo.png";


class Home extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            loading: false,
            faceKey: "YOUR KEY",
            faceEndPoint: "https://motion-sensor-face-api.cognitiveservices.azure.com/",
            photoReady: false,
            base64: "",
            result: "",
            name: "",
            registerdName: "",
            faceId: "",
            gender: "",
            age: "",
            resultFaceAttributes: "",

        }

        this.callFaceAPI = this.callFaceAPI.bind(this);
        this.changeName = this.changeName.bind(this);

    }
    
    async changeName(){
        db.collection("faceAPI").doc(this.state.faceId).set({
            name: this.state.name,
            faceid: this.state.faceId,
            gender: this.state.gender,
            age: this.state.age,
        }, {merge: true})
        .then(()=>{
            alert("Name Updated")
            window.location.reload(true)
        })
        .catch((error) => {
            console.log(error)
        })
        
    }

    async callFaceAPI(binaryObject){
        const faceKey = this.state.faceKey;
        const faceEndPoint = this.state.faceEndPoint;
        const cognitiveServiceCredentials = new CognitiveServicesCredentials(faceKey)
        const client = new FaceClient(cognitiveServiceCredentials, faceEndPoint);
        const options = {
            returnFaceLandmarks: true,
            returnFaceAttributes: [
                'age',
                'gender',
                'headPose',
                'smile',
                'facialHair',
                'glasses',
                'emotion',
                'makeup'
            ]
        };

        client.face.detectWithStream(binaryObject/*faceURL */, options)
        .then(result => {
            console.log("The result is: ");
            console.log(result);

            if(result.length == 1){
                const faceAttributes = result[0].faceAttributes;
                const findSimilarOptions = {
                    faceListId: "memori2021"
                }
                this.setState({
                    age: result[0].faceAttributes.age,
                    gender: result[0].faceAttributes.gender,

                })
                this.setState({
                    resultFaceAttributes: <div>
                        <h3>Result:</h3>
                        Age: {faceAttributes.age}<br/>
                        Gender: {faceAttributes.gender}<br/>
                        ---------------------------------------<br/>
                        <h4>Emotion</h4>
                        Anger: {faceAttributes.emotion.anger}、
                        COntempt: {faceAttributes.emotion.contempt}、
                        Disgust: {faceAttributes.emotion.disgust}、
                        Fear: {faceAttributes.emotion.fear}<br/>
                        Happiness: {faceAttributes.emotion.happiness}、
                        Neautral: {faceAttributes.emotion.neutral}、
                        Sadness: {faceAttributes.emotion.sadness}、
                        Surprise: {faceAttributes.emotion.surprise}<br/><br/>
                        <h4>Others</h4>
                        Glasses: {faceAttributes.glasses==="NoGlasses" ? "No":"Yes"}<br/>
                        Eye Makeup: {faceAttributes.makeup.eyeMakeup ? "Yes":"No"}<br/>
                        Lip Makeup: {faceAttributes.makeup.lipMakeup ? "Yes":"No"}<br/>

                    </div>
                })
                client.face.findSimilar(result[0].faceId,findSimilarOptions)
                .then(resultSimilar => {
                    console.log(resultSimilar)
                    var faceId = "";
                    if(resultSimilar.length === 1){
                        console.log("found id: " + resultSimilar[0].persistedFaceId)
                        faceId = resultSimilar[0].persistedFaceId;
                        db.collection("faceAPI").doc(faceId).get().then(snapshot => {
                            try{
                                this.setState({registerdName: snapshot.data()["name"]})
                            }catch(e){

                            }
                            this.setState({
                                result: <div>
                                    Registered Name: <br/>
                                    {this.state.registerdName}<br/><br/>
                                    <TextField label="Outlined" variant="outlined" color="primary" onChange={e => {this.setState({name: e.target.value})}}/><br/>
                                    <Button color="secondary" variant="contained" onClick={this.changeName.bind(this)}>Update Name</Button>

                                </div>
                            })
                        })
                        this.setState({faceId: faceId});
                        
                        alert("This face is already registered")
                    }else if(resultSimilar.length === 0){
                        client.faceList.addFaceFromStream("memori2021", binaryObject)
                        .then(resultAdd => {
                            console.log(resultAdd.persistedFaceId);
                            faceId = resultAdd.persistedFaceId;
                            this.setState({
                                result: <div>
                                    Add Name<br/>
                                    <TextField label="Outlined" variant="outlined" color="primary" onChange={e => {this.setState({name: e.target.value})}}/><br/>
                                    <Button color="secondary" variant="contained" onClick={this.changeName.bind(this)}>Register Name</Button>
                                </div>
                            })
                            this.setState({faceId: faceId});
                            alert("Face ID registered")
                        })
                    }

                })
            }else if(result.length === 0){
                this.setState({result: <div></div>})
                alert("There is no person in the photo")
            }else{
                this.setState({result: <div></div>})
                alert("There are more than 1 person in the photo");
            }

            
            
        })
        .catch(err => {
            console.log("An error occured:");
            console.log(err);
        })

    }

    render(){
        return(
            <div>
                <LoadingOverlay active={this.state.loading} spinner text="Loading...">
                    <Grid container alignContent="center" alignItems="center" justify="center">
                        <Grid item xs={12}>
                            <h1>Register Face</h1>
                            <ImagePicker
                    extensions={['jpg', 'jpeg', 'png']}
                    dims={{ minWidth: 100, maxWidth: 7680, minHeight: 100, maxHeight: 4320 }}
                    onChange={base64 => {
                        this.setState({base64: base64, photoReady: true})
                        fetch(base64)
                        .then(res => res.blob())
                        .then(blob => {
                            this.callFaceAPI(blob)
                        })
                    }}
                    onError={errMsg => {
                        alert(errMsg);
                    }}
                >
                    <Button variant="contained" color="primary" >
                        Choose Image
                    </Button>

                </ImagePicker>
                <br/><br/>
                <Link to="/compare">Compare two faces</Link>
                <br/><br/>
                {this.state.photoReady ? 
                    <img src={this.state.base64} width="80%"/>
                :
                    null
                }
                <br/><br/>
                {this.state.resultFaceAttributes}<br/><br/>
                {this.state.result}
                        </Grid>
                    </Grid>
                </LoadingOverlay>
            </div>
        )
    }
}

export default Home;