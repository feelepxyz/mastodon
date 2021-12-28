import React from 'react';
import PropTypes from 'prop-types';
import api from 'mastodon/api';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import classNames from 'classnames';

const messages = defineMessages({
  other: { id: 'report.categories.other', defaultMessage: 'Other' },
  spam: { id: 'report.categories.spam', defaultMessage: 'Spam' },
  violation: { id: 'report.categories.violation', defaultMessage: 'Content violates one or more server rules' },
});

class Category extends React.PureComponent {

  static propTypes = {
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func,
    children: PropTypes.node,
  };

  handleClick = () => {
    const { id, onSelect } = this.props;
    onSelect(id);
  };

  render () {
    const { id, text, onSelect, selected, children } = this.props;

    return (
      <div tabIndex='0' className={classNames('report-reason-selector__category', { selected })} onClick={this.handleClick}>
        {selected && <input type='hidden' name='report[category]' value={id} />}

        <div className='report-reason-selector__category__label'>
          <span className={classNames('poll__input', { active: selected })} />
          {text}
        </div>

        {(selected && children) && (
          <div className='report-reason-selector__category__rules'>
            {children}
          </div>
        )}
      </div>
    );
  }

}

class Rule extends React.PureComponent {

  static propTypes = {
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    onToggle: PropTypes.func,
  };

  handleClick = () => {
    const { id, onToggle } = this.props;
    onToggle(id);
  };

  render () {
    const { id, text, selected, onSelect } = this.props;

    return (
      <div tabIndex='0' className={classNames('report-reason-selector__rule', { selected })} onClick={this.handleClick}>
        <span className={classNames('poll__input', { checkbox: true, active: selected })} />
        {selected && <input type='hidden' name='report[rule_ids][]' value={id} />}
        {text}
      </div>
    );
  }

}

export default @injectIntl
class ReportReasonSelector extends React.PureComponent {

  static propTypes = {
    category: PropTypes.string.isRequired,
    rule_ids: PropTypes.arrayOf(PropTypes.string),
    intl: PropTypes.object.isRequired,
  };

  state = {
    category: this.props.category,
    rule_ids: this.props.rule_ids || [],
    rules: [],
  };

  componentDidMount() {
    api().get('/api/v1/instance').then(res => {
      this.setState({
        rules: res.data.rules,
      });
    }).catch(err => {
      console.error(err);
    });
  }

  _save = () => {
    const { id } = this.props;
    const { category, rule_ids } = this.state;

    api().put(`/api/v1/admin/reports/${id}`, {
      category,
      rule_ids,
    }).catch(err => {
      console.error(err);
    });
  };

  handleSelect = id => {
    this.setState({ category: id }, () => this._save());
  };

  handleToggle = id => {
    const { rule_ids } = this.state;

    if (rule_ids.includes(id)) {
      this.setState({ rule_ids: rule_ids.filter(x => x !== id ) }, () => this._save());
    } else {
      this.setState({ rule_ids: [...rule_ids, id] }, () => this._save());
    }
  };

  render () {
    const { intl } = this.props;
    const { rules, category, rule_ids } = this.state;

    return (
      <div className='report-reason-selector'>
        <Category id='other' text={intl.formatMessage(messages.other)} selected={category === 'other'} onSelect={this.handleSelect} />
        <Category id='spam' text={intl.formatMessage(messages.spam)} selected={category === 'spam'} onSelect={this.handleSelect} />
        <Category id='violation' text={intl.formatMessage(messages.violation)} selected={category === 'violation'} onSelect={this.handleSelect}>
          {rules.map(rule => <Rule key={rule.id} id={rule.id} text={rule.text} selected={rule_ids.includes(rule.id)} onToggle={this.handleToggle} />)}
        </Category>
      </div>
    );
  }

}
