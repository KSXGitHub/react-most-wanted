const notifications = require('./notifications');

module.exports = {
  handleUserChatMessageCreate: (event, admin) => {

    if(event.auth.admin){
      return;
    }

    const senderUid = event.params.senderUid;
    const receiverUid = event.params.receiverUid;
    const messageUid = event.params.messageUid;
    const eventSnapshot = event.data;
    const snapValues=eventSnapshot.val();
    const senderChatRef=admin.database().ref(`/user_chats/${senderUid}/${receiverUid}`);
    const receiverChatRef=admin.database().ref(`/user_chats/${receiverUid}/${senderUid}`);
    const receiverChatUnreadRef=admin.database().ref(`/user_chats/${receiverUid}/${senderUid}/unread`);
    const receiverChatMessageRef=admin.database().ref(`/user_chat_messages/${receiverUid}/${senderUid}/${messageUid}`);

    console.log(`Message ${messageUid} ${snapValues.message} created! Sender ${senderUid}, receiver ${receiverUid}`);

    const udateReceiverChatMessage=receiverChatMessageRef.update(snapValues)
    const udateSenderChat=senderChatRef.update({
      unread: 0,
      lastMessage: snapValues.message,
      lastCreated: snapValues.created
    })
    const udateReceiverChat=receiverChatRef.update({
      displayName: snapValues.authorName,
      photoURL: snapValues.authorPhotoUrl?snapValues.authorPhotoUrl:'',
      lastMessage: snapValues.message,
      lastCreated: snapValues.created
    })
    const updateReceiverUnred=receiverChatUnreadRef.transaction(number=>{
      return (number || 0) + 1;
    })

    let notifyUser=false;


    if(snapValues.authorUid!==receiverUid){

      const payload = {
        notification: {
          title: `${snapValues.authorName} `,
          body: snapValues.message,
          icon: snapValues.authorPhotoUrl?snapValues.authorPhotoUrl:'/apple-touch-icon.png',
          click_action: `https://www.react-most-wanted.com/chats/edit/${senderUid}`,
          tag: `chat`,
        }
      };

      notifyUser=notifications.notifyUser(admin, receiverUid, payload);
    }

    return Promise.all([
      udateReceiverChatMessage,
      udateSenderChat,
      udateReceiverChat,
      updateReceiverUnred,
      notifyUser,
    ])

  },

};
