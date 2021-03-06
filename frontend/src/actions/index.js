import fetch from 'isomorphic-fetch'
// import download from 'download.js'
import { CALL_API } from '../middleware/api'

export const requestSamples = () => {
    return {
        type: 'REQUEST_SAMPLES'
    }
}

export const receiveSamples = (samples) => {
    return {
        type: 'RECEIVE_SAMPLES',
        samples
    }
}

// Just a dummy callback to execute when validation completes
export const completeValidation = (id, json) => {
    return {
        type: 'COMPLETE_VALIDATION',
        id: id
    }
}

export const login = credentials => {
    return (dispatch) => {
        dispatch({
            [CALL_API]: {
                /*types: [ 'REDIRECT_TO_HOME', 'REDIRECT_TO_LOGIN' ],*/
                endpoint: '/authenticate',
                method: 'POST',
                body: credentials,
                auth_needed: false
            }
        }).then(response => {
            dispatch({
                type: 'REDIRECT_TO_HOME',
                response: response
            })
        })
    }
}

export const importFunc = files => {
    return (dispatch) => {
        dispatch({
            [CALL_API]: {
                /*types: [ 'REDIRECT_TO_HOME', 'REDIRECT_TO_LOGIN' ],*/
                endpoint: '/import',
                method: 'POST',
                body: files,
                auth_needed: true
            }
        }).then(response => {
            dispatch({
                type: 'REDIRECT_TO_HOME',
                response: response
            })
        })
    }
}

export const search = parameters => {
    return (dispatch) => {

        dispatch({
            [CALL_API]: {
                endpoint: '/search',
                method: 'GET',
                body: parameters,
                auth_needed: true
            }
        }).then(response => {
            dispatch({
                type: 'DISPLAY_RESULTS',
                response: response,
            })
        })
    }
}

export const exportSamples = parameters => {
    return (dispatch) => {
        dispatch({
            [CALL_API]: {
                endpoint: '/export',
                method: 'GET',
                body: parameters,
                auth_needed: true
            }
        }).then(response => {
            dispatch({
                [CALL_API]: {
                    endpoint: '/storage/exports/' + response.filename,
                    method: 'GET',
                    auth_needed: true
                }
            }).then(response => {
                dispatch(
                    download(response, 'export.zip', 'application/zip') 
                )
            })
        })
    }
}

export const fetchSampleContent = () => {
    
    
    return (dispatch, getState) => {

        dispatch({
            type: 'FETCHING',
            isFetching: true
        })
        
        const { validationReducer } = getState();

        dispatch({
            [CALL_API]: {
                endpoint: '/storage/img/' + validationReducer.samples[validationReducer.active].img,
                method: 'GET',
                auth_needed: true
            }
        }).then(response =>
            dispatch({
                type: 'RECEIVE_SAMPLE_IMG',
                response: response,
            })
        ).then(action =>
            dispatch({
                [CALL_API]: {
                    endpoint: '/storage/samples/' + validationReducer.samples[validationReducer.active].sample,
                    method: 'GET',
                    auth_needed: true
                }
            })
        ).then(response =>
            dispatch({
                type: 'RECEIVE_SAMPLE_AUDIO',
                response: response
            })
        ).then(action => 
            dispatch({
                type: 'FETCHING',
                isFetching: false
            })
        )

    }
}

export const fetchSamples = () => {
    let samples = []
    return (dispatch) => {
        dispatch({
            [CALL_API]: {
                /*types: [ 'RECEIVE_SAMPLES', 'DUMMY_FAILURE' ],*/
                endpoint: '/samples',
                method: 'GET',
                auth_needed: true
            }
        }).then(response => {
            samples = response
            return dispatch({
                type: 'RECEIVE_SAMPLES',
                response: response
            })
        }).then(action => dispatch(fetchSampleContent()))
        
    }
}

// This action is dispatched when a sample gets validated
export const validateSample = (comment) => {
    return (dispatch, getState) => {
        const { validationReducer } = getState()
        const id = validationReducer.samples[validationReducer.active].id
        const body = {
            op: 'add',
            field: comment,
            value: 1
        }

        return dispatch({
            [CALL_API]: {
                endpoint: '/samples/' + id,
                method: 'PUT',
                body: body,
                auth_needed: true
            }
        }).then(response => {
            // This action updates the counter
            dispatch({
                type: 'VALIDATE_SAMPLE'
            })

            // Fetch next sample list if current samples are all validated
            if (validationReducer.active + 1 >= Object.keys(validationReducer.samples).length) {
                return dispatch(fetchSamples())
            } else {
                // Simply fetch the next sample's content if the list is not exhausted
                return dispatch(fetchSampleContent())
            }
        })
    }
}
