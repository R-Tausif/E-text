let userProgress = {
    'while_loops': {
        questions: {},
        badges: [],
        rating: 0,
        system_rating: '',
    },
    'nested_while_loops': {
        questions: {},
        badges: [],
        rating: 0,
        system_rating: '',
    }
};

let currentModuleId = null;

const badgeDefinitions = {
    completion: {
        name: "Module Completion",
        image: "/source/_static/badge.png", 
        checkCriteria: (moduleId) => {
            const questions = userProgress[moduleId].questions;
            return Object.keys(questions).length > 0 && Object.values(questions).every(status => status === true);
        }
    },
    firstAttempt: {
        name: "Expert Achiever",
        image: "/source/_static/badge.png",
        checkCriteria: (qid, answeredQuestions) => {
            const question = answeredQuestions[qid];
            return question && question.attempts === 1 && question.correct === true;
        }
    }
};

function getCurrentModuleId() {
    const pagemetaTags = document.querySelectorAll('script[type="application/json"][id="pagemeta"]');
    // Assuming you want the last `pagemeta` if there are multiple
    const pagemeta = pagemetaTags[pagemetaTags.length - 1];
    if (pagemeta && pagemeta.textContent) {
        try {
            const metaData = JSON.parse(pagemeta.textContent);
            return metaData.component;  // Returns the module ID
        } catch (e) {
            console.error('Error parsing pagemeta:', e);
        }
    }
    return null; // Or a default value if no pagemeta is found
}
// console.log("Current Module ID:", getCurrentModuleId());


// Points
function sendmcq(qid) {
    // console.log('in sendmcq for qid: ', qid);
    var form = document.getElementById(qid);
    var answersData = JSON.parse(document.getElementById(qid + '-answers').textContent);
    var selectedValue = null;
    var moduleId = getCurrentModuleId(); 

    // Fetch the answered questions
    var answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || {};
    var moduleQuestions = userProgress[moduleId] ? userProgress[moduleId].questions : {};

    // Prevent further attempts if maximum attempts are reached
    // if (answeredQuestions[qid] && answeredQuestions[qid].attempts >= 2) {
    //     alert("You have already attempted this question twice.");
    //     displayPreviousAnswers(answeredQuestions[qid].lastAnswer);
    //     return;
    // }

    var radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach(function(radio) {
        var feedbackElement = document.getElementById(radio.id + '-feedback');
        feedbackElement.textContent = ''; // Clear feedback text
        feedbackElement.style.color = ''; // Clear feedback color
    });

    radios.forEach(function(radio) {
        if (radio.checked) {
            selectedValue = radio.value;
            answersData.forEach(function(answer) {
                if (answer.ansid === radio.id) {
                    var feedbackElement = document.getElementById(radio.id + '-feedback');
                    feedbackElement.textContent = answer.feedback;
                    feedbackElement.style.color = answer.result === "correct" ? 'green' : 'red';

                    if (!answeredQuestions[qid]) {
                        answeredQuestions[qid] = {
                            attempts: 1, 
                            correct: false, 
                            pointsAwarded: false,
                            lastAnswer: answer.ansid,
                            feedback: answer.feedback,
                        };
                    } else {
                        answeredQuestions[qid].attempts++;
                        answeredQuestions[qid].lastAnswer = answer.ansid;
                        answeredQuestions[qid].feedback = answer.feedback;
                    }

                    let points = 0;
                    const attempts = answeredQuestions[qid].attempts;
                    if (attempts === 1){
                        points = 5;
                    } else if (attempts === 2){
                        points = 3;
                    } else if (attempts === 3){
                        points = 2;
                    } else if (attempts === 4){
                        points = 1;
                    } else {
                        points = 0;
                    }

                    if (answer.result === 'correct') {
                        moduleQuestions[qid] = {correct: true};
                        if (!answeredQuestions[qid].pointsAwarded){
                            updatePoints(points);
                            answeredQuestions[qid].correct = true;
                            answeredQuestions[qid].pointsAwarded = true;
                        }
                    }
                    
        
                    localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions));
                    saveProgressToStorage();

                    // Handing badges for module completion
                    if (checkAllQuestionsAnsweredCorrectly(moduleId)) {
                        if (badgeDefinitions.firstAttempt.checkCriteria(qid, answeredQuestions) && 
                        !userProgress[moduleId].badges.includes(badgeDefinitions.firstAttempt.name)) {
                            userProgress[moduleId].badges.push(badgeDefinitions.firstAttempt.name);
                            displayBadge(badgeDefinitions.firstAttempt, true);
                        }
                        // Check if badge already awarded
                        // if (!userProgress[moduleId].badges.includes("Module Completion")) {
                        //     checkAndAwardBadges(moduleId);
                        // }
                    }   
                }
            });
        }
    });

    if (!selectedValue) {
        console.log("No option selected.");
    }
}

function displayPreviousAnswers(qid) {
    var answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || {};
    if (answeredQuestions[qid] && answeredQuestions[qid].lastAnswer) {
        var lastAnswerId = answeredQuestions[qid].lastAnswer;
        var feedbackElement = document.getElementById(lastAnswerId + '-feedback');
        var answerRadio = document.getElementById(lastAnswerId);

        if (feedbackElement && answerRadio) {
            feedbackElement.textContent = answeredQuestions[qid].feedback;
            feedbackElement.style.color = 'blue';  
            answerRadio.checked = true;  // Check the radio button of the last selected answer
        }
    }
}

function initializeAnswersDisplay(){
    var answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || {};
    Object.keys(answeredQuestions).forEach(function(qid) {
        if (answeredQuestions[qid].attempts >= 2) {
            displayPreviousAnswers(qid);
        }
    });
}

function updatePoints(points){
    var currentPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
    var prevPoints = currentPoints;
    currentPoints += points;
    localStorage.setItem('totalPoints', currentPoints);
    displayPoints();
    if (currentPoints > prevPoints) {
        triggerConfetti();
    }
}

function displayPoints(){
    var totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
    var maxPointsElement = document.getElementById('maxPoints');
    var maxPoints = maxPointsElement ? parseInt(maxPointsElement.getAttribute('data-max-points')) : 10;
    // console.log(maxPoints);
    document.getElementById('totalPoints').textContent = `XP: ${totalPoints}/${maxPoints}`;
}


// Function to initialize the point system only if not already set
function initializePoints() {
    if (localStorage.getItem('totalPoints') === null) {
        localStorage.setItem('totalPoints', 0);
    }
    if (localStorage.getItem('answeredQuestions') === null) {
        localStorage.setItem('answeredQuestions', JSON.stringify({}));
    }
    displayPoints();
}


// Badges

function getTotalBadges() {
    return Object.keys(badgeDefinitions).length;
}

function initializeBadgesDisplay() {
    const badgeCountElement = document.getElementById('badge-count');
    if (badgeCountElement) {
        badgeCountElement.textContent = `Badges: 0/${getTotalBadges()}`;
    }
}

function displayBadge(badgeInfo, isNewBadge) {
    const badgeContainer = document.getElementById('badgeContainer');
    const badgeCountElement = document.getElementById('badge-count'); 
    if (!badgeContainer) {
        console.log('Badge container not found on the page.');
        return;
    }
    const badgeElement = document.createElement('div');
    badgeElement.className = 'badge';
    badgeElement.textContent = '';
    badgeElement.style.backgroundImage = `url('_static/badge.png')`;
    badgeContainer.appendChild(badgeElement);

    const currentModuleId = getCurrentModuleId();
    const currentBadgeCount = userProgress[currentModuleId].badges.length;
    console.log(currentBadgeCount);
    badgeCountElement.textContent = `Badges: ${currentBadgeCount}/${getTotalBadges()}`;

    if (isNewBadge){
        triggerConfetti()
        showBadgeEarnedMessage(badgeInfo.name)
    }

}


function checkAllQuestionsAnsweredCorrectly(moduleID) {
    const questions = userProgress[moduleID].questions;

    const totalQuestions = 3; 
    // Check if the number of questions answered is equal to totalQuestions
    const allCorrect = (Object.keys(questions).length === totalQuestions) 
                        && Object.values(questions).every(q => q && q.correct === true);

    // console.log("Questions Object: ", questions);
    // console.log("All questions correct: ", allCorrect);

    return allCorrect;
}


function markModuleAsComplete(){
    moduleId = getCurrentModuleId();
    console.log(moduleId);
    if (checkAllQuestionsAnsweredCorrectly(moduleId)) {
        // Check if badge already awarded
        if (!userProgress[moduleId].badges.includes("Module Completion")) {
            checkAndAwardBadges(moduleId);
            console.log("Module marked as complete and badge awarded");
        } else{
            console.log("Module completion already badge awarded");
        }
    } else {
        alert("Please answer all questions correctly before marking the module as complete.")
    }

}

// Function to save user progress to local storage
function saveProgressToStorage() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

function checkAndAwardBadges(moduleId) {
    // console.log('in check and award badges');
    Object.entries(badgeDefinitions).forEach(([badgeKey, badgeInfo]) => {
        if (!userProgress[moduleId].badges.includes(badgeInfo.name)) {
            // console.log('in if statment of check and award badge')
            userProgress[moduleId].badges.push(badgeInfo.name);
            displayBadge(badgeInfo, true);
            saveProgressToStorage();
        }
    });
    
}

function loadProgressFromStorage() {
    const savedProgress = localStorage.getItem('userProgress');
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
        Object.keys(userProgress).forEach(moduleId => {
            userProgress[moduleId].badges.forEach(badgeName => {
                const badgeInfo = Object.values(badgeDefinitions).find(badge => badge.name === badgeName);
                if (badgeInfo) {
                    displayBadge(badgeInfo, true);
                }
            });
        });
    }
}

function showBadgeEarnedMessage(badgeName){
    const messageElement = document.createElement('div');
    messageElement.className = 'badge-earned-message';
    messageElement.textContent = `Congratulations! You've earned the ${badgeName} badge!`;

    // Style the message element
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '20px';
    messageElement.style.backgroundColor = '#fff';
    messageElement.style.color = '#333';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.border = '2px solid black';
    messageElement.style.borderRadius = '10px';
    messageElement.style.zIndex = '1000';
    messageElement.style.textAlign = 'center';

    // Append the message element to the body
    document.body.appendChild(messageElement);

    // Remove the message after 5 seconds
    setTimeout(() => {
        document.body.removeChild(messageElement);
    }, 5000);
}

function resetProgress(){
    localStorage.setItem('totalPoints', 0);
    var answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || {};
    Object.keys(answeredQuestions).forEach(function(qid){
        answeredQuestions[qid].attempts = 0;
        answeredQuestions[qid].pointsAwarded = false;
        answeredQuestions[qid].correct = false;
    });

    userProgress = {
        'while_loops': { questions: {}, badges: [],  rating: 0, system_rating: '', },
        'nested_while_loops': { questions: {}, badges: [], rating: 0, system_rating: '', }
    };

    // Save the reset state to storage
    saveProgressToStorage();
    localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions));
    displayPoints();
}


// Self-rating of knowledge
function submitRating(){
    var ratings = document.getElementsByName('knowledge-rating');
    let selectedRating = null;

    
    // Check which rating was selected
    for (var i = 0; i < ratings.length; i++) {
        if (ratings[i].checked) {
            selectedRating = ratings[i].value;
            userProgress[getCurrentModuleId()].rating = selectedRating;
            // localStorage.setItem('userRating', selectedRating);  // Store the rating
            document.getElementById('rating-result').textContent = 'You rated your confidence as: ' + selectedRating;
            break;
        }
    }

    if (selectedRating === null) {
        document.getElementById('rating-result').textContent = 'Please select your confidence level.';
    }
    document.getElementById('self-rating-form').reset();
}

function checkRating(qid) {
    clearPreviousFeedback(qid);

    // Check if the user rated their knowledge
    let userRating = userProgress[getCurrentModuleId()].rating;
    if (userRating === 0) {
        document.getElementById(qid + '-feedback').textContent = 'Please submit your confidence rating before checking the answer.';
        return;  
    }

    var answersData = JSON.parse(document.getElementById(qid + '-answers').textContent); 
    // Get the selected answer for this question
    var selectedAnswer = document.querySelector('input[name="' + qid + '"]:checked');
    let feedbackMessage = "";
    // let userRating = userProgress[getCurrentModuleId()].rating;
    // console.log("in checkrating", userRating);

    if (selectedAnswer) {
        // Find the correct feedback in the JSON based on the selected answer
        const selectedFeedback = answersData.find(answer => answer.ansid === selectedAnswer.id);
        // console.log(selectedFeedback);

        if (selectedFeedback) {
            feedbackMessage = selectedFeedback.feedback;
            const feedbackElement = document.getElementById(selectedFeedback.ansid + '-feedback');
            feedbackElement.style.color = selectedFeedback.result === "correct" ? 'green' : 'red';
            // console.log(feedbackMessage);

            // If a user rating exists, provide feedback comparing their rating to performance
            if (userRating > 0) {
                compareRatingWithPerformance(selectedFeedback.ansid, feedbackMessage, selectedFeedback.result === 'correct', userRating);
            } else {
                document.getElementById(qid + '-feedback').textContent = feedbackMessage + " Please make sure to submit your self-rating.";
            }
        }
    } else {
        document.getElementById(qid + '-feedback').textContent = 'Please select an answer.';
    }
}

function clearPreviousFeedback(qid) {
    // Get all feedback spans related to this quiz
    var feedbackElements = document.querySelectorAll('#' + qid + ' .feedback');
    
    // Loop through all feedback elements and clear their content
    feedbackElements.forEach(function(feedbackElement) {
        feedbackElement.textContent = ''; // Clear feedback text
        feedbackElement.style.color = ''; // Reset any previous color applied
    });
}

function compareRatingWithPerformance(qid, feedbackMessage, isCorrect, userRating){
    // console.log(feedbackMessage, isCorrect, userRating);
    let resultFeedback = "";
    userRating = parseInt(userProgress[getCurrentModuleId()].rating, 10);
    // console.log(userRating);

    if (isCorrect){
        if (userRating >= 4){
            resultFeedback = feedbackMessage + " Your confident matches your performance! Well done!";
            userProgress[getCurrentModuleId()].system_rating = 'Confidence Matches Performance';
        }else {
            resultFeedback = feedbackMessage + " You may have underestimated your understanding. Good job!";
            userProgress[getCurrentModuleId()].system_rating = 'Underconfident but High Performance ';
        }
    } else {
        if (userRating >=4){
            resultFeedback = feedbackMessage + " Oh-Oh it seems that actually have to spend a bit more time in this module.";
            userProgress[getCurrentModuleId()].system_rating = 'Confident but needs practice';
        } else {
            resultFeedback = feedbackMessage + " Your self-rating was accurate. Keep practicing!";
            userProgress[getCurrentModuleId()].system_rating = 'Accurate but needs practice';
            
        }
    }

    // console.log( userProgress[getCurrentModuleId()].system_rating);
     // Display the feedback to the user
    document.getElementById(qid + '-feedback').textContent = resultFeedback;
}


// No reset functionality needed unless explicitly called by another user action
window.onload = function() {
    // resetProgress();
    currentModuleId = getCurrentModuleId();
    loadProgressFromStorage();
    initializePoints();
    initializeAnswersDisplay();
    initializeBadgesDisplay();
}
