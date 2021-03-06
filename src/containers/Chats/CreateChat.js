import React, {Component} from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import muiThemeable from 'material-ui/styles/muiThemeable';
import {injectIntl, intlShape} from 'react-intl';
import { Activity } from '../../containers/Activity';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Avatar from 'material-ui/Avatar';
import FontIcon from 'material-ui/FontIcon';
import { withRouter } from 'react-router-dom';
import {GoogleIcon, FacebookIcon, GitHubIcon, TwitterIcon} from '../../components/Icons';
import IconButton from 'material-ui/IconButton';
import { withFirebase } from 'firekit';
import ReactList from 'react-list';
import { FilterDrawer, filterSelectors, filterActions } from 'material-ui-filter'
import { ResponsiveMenu } from 'material-ui-responsive-menu';
import { setPersistentValue } from '../../store/persistentValues/actions';

const path=`users`;

class Users extends Component {

  componentDidMount() {
    this.props.watchList(path);
  }

  getProviderIcon = (provider) => {

    const {muiTheme} =this.props;

    const color=muiTheme.palette.primary2Color;

    switch (provider.providerId) {
      case 'google.com':
      return <IconButton key={provider.providerId}>
        <GoogleIcon color={color}/>
      </IconButton>
      case 'facebook.com':
      return <IconButton key={provider.providerId}>
        <FacebookIcon color={color}/>
      </IconButton>
      case 'twitter.com':
      return <IconButton key={provider.providerId}>
        <TwitterIcon color={color}/>
      </IconButton>
      case 'github.com':
      return <IconButton   key={provider.providerId}>
        <GitHubIcon color={color}/>
      </IconButton>
      case 'phone':
      return <IconButton   key={provider.providerId} >
        <FontIcon className="material-icons" color={color} >phone</FontIcon>
      </IconButton>
      case 'password':
      return <IconButton   key={provider.providerId}>
        <FontIcon className="material-icons" color={color} >email</FontIcon>
      </IconButton>
      default:
      return undefined;
    }
  }

  handleRowClick = (user) => {
    const {auth, firebaseApp, history, usePreview, setPersistentValue} =this.props;

    const key=user.key;
    const userValues=user.val;
    const userChatsRef=firebaseApp.database().ref(`/user_chats/${auth.uid}/${key}`);

    const chatData={
      displayName: userValues.displayName,
      photoURL: userValues.photoURL?userValues.photoURL:'',
      lastMessage: ''
    };

    userChatsRef.update({...chatData});

    if(usePreview){
      setPersistentValue('current_chat_uid', key)
      history.push(`/chats`);
    }else{
      history.push(`/chats/edit/${key}`);
    }
  }


  renderItem = (index, key) => {
    const { auth, users, intl, muiTheme } =this.props;

    if (users[index] == null) {
      return <div key={index}></div>;
    }

    const user = users[index].val;

    if (users[index].key === auth.uid) {
      return <div key={index}></div>;
    }

    return <div key={index}>
      <ListItem
        key={key}
        id={key}
        onClick={()=>{this.handleRowClick(users[index])}}
        leftAvatar={<Avatar src={user.photoURL} alt="person" icon={<FontIcon className="material-icons" >person</FontIcon>}/>}
        rightIcon={<FontIcon className="material-icons" color={user.connections?'green':'red'}>offline_pin</FontIcon>}>

        <div style={{display: 'flex'}}>
          <div>
            <div>
              {user.displayName}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: '16px',
                height: 16,
                margin: 0,
                marginTop: 4,
                color: muiTheme.listItem.secondaryTextColor,
              }}>
              <p>
                {(!user.connections && !user.lastOnline)?intl.formatMessage({id: 'offline'}):intl.formatMessage({id: 'online'})}
                {' '}
                {(!user.connections && user.lastOnline)?intl.formatRelative(new Date(user.lastOnline)):undefined}
              </p>
            </div>

          </div>

          <div style={{alignSelf: 'center', flexDirection: 'row', display: 'flex'}}>
            {user.providerData && user.providerData.map(
              (p)=>{
                return this.getProviderIcon(p);
              })
            }
          </div>
        </div>

      </ListItem>
      <Divider inset={true}/>
    </div>;
  }

  render(){
    const {
      intl,
      users,
      muiTheme,
      setFilterIsOpen,
      hasFilters,
      history
    } = this.props;

    const filterFields = [
      {
        name: 'displayName',
        label: intl.formatMessage({id: 'name'})
       }
    ];

    const menuList=[
      {
        text: intl.formatMessage({id: 'open_filter'}),
        icon: <FontIcon className="material-icons" color={hasFilters?muiTheme.palette.accent1Color:muiTheme.palette.canvasColor}>filter_list</FontIcon>,
        tooltip:intl.formatMessage({id: 'open_filter'}),
        onClick: ()=>{setFilterIsOpen('select_user', true)}
      },
    ]

    return (
      <Activity
        isLoading={users===undefined}
        onBackClick={()=>{history.push('/chats')}}
        iconStyleRight={{width:'50%'}}
        iconElementRight={
          <div>
            <ResponsiveMenu
              iconMenuColor={muiTheme.palette.canvasColor}
              menuList={menuList}
            />
          </div>
        }
        title={intl.formatMessage({id: 'select_user'})}>
        <div >

          <div style={{overflow: 'none', backgroundColor: muiTheme.palette.convasColor}}>
            <List  id='test' style={{height: '100%'}} ref={(field) => { this.list = field; }}>
              <ReactList
                itemRenderer={this.renderItem}
                length={users?users.length:0}
                type='simple'
              />
            </List>
          </div>

        </div>

        <FilterDrawer
          formatMessage={intl.formatMessage}
          name={'select_user'}
          fields={filterFields}
        />


      </Activity>
    );

  }

}

Users.propTypes = {
  users: PropTypes.array.isRequired,
  intl: intlShape.isRequired,
  muiTheme: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { lists, auth, filters, browser } = state;

  const { hasFilters } = filterSelectors.selectFilterProps('select_user', filters);
  const users=filterSelectors.getFilteredList('select_user', filters, lists['users'], fieldValue => fieldValue.val);
  const usePreview=browser.greaterThan.small;

  return {
    usePreview,
    hasFilters,
    users,
    auth
  };
};


export default connect(
  mapStateToProps, { ...filterActions, setPersistentValue }
)(injectIntl(muiThemeable()(withFirebase(withRouter(Users)))));
