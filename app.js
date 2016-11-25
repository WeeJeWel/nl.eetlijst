'use strict';

const Eetlijst = require('eetlijst');

class App {

	constructor() {

		this.init = this._onInit.bind(this);

		this._eetlijst = undefined;

		Homey.manager('flow')
			.on('condition.today_has_cook', this._onFlowConditionTodayHasCook.bind(this))

			.on('condition.user_has_status_today', this._onFlowConditionUserHasStatusToday.bind(this))
			.on('condition.user_has_status_today.user.autocomplete', this._onFlowUserAutocomplete.bind(this))

			.on('action.set_state_today', this._onFlowActionSetStateToday.bind(this))
			.on('action.set_state_today.user.autocomplete', this._onFlowUserAutocomplete.bind(this))

		Homey.manager('settings').on('set', () => {
			this._initEetlijst();
		})

	}

	_onInit() {

		console.log(`${Homey.manifest.id} running...`);

		let result = this._initEetlijst();
		if( result instanceof Error ) console.error( result );

	}

	_initEetlijst() {

		let username = Homey.manager('settings').get('username');
		let password = Homey.manager('settings').get('password');

		if( !username || !password )
			return new Error('missing_credentials');

		this._eetlijst = new Eetlijst( username, password );

	}

	_onFlowConditionTodayHasCook( callback, args ) {

		if( !this._eetlijst )
			return callback( new Error('not_logged_in') );

		this._eetlijst
			.getSummary()
			.then( summary => {
				callback( null, summary.days[0].totals.cook > 0 );
			})
			.catch( callback );

	}

	_onFlowConditionUserHasStatusToday( callback, args ) {

		if( !this._eetlijst )
			return callback( new Error('not_logged_in') );

		this._eetlijst
			.getSummary()
			.then( summary => {
				callback( null, summary.days[0].users[ args.user.name ] === args.state );
			})
			.catch( callback );

	}

	_onFlowActionSetStateToday( callback, args ) {

		if( !this._eetlijst )
			return callback( new Error('not_logged_in') );

		this._eetlijst
			.setUserState( args.user.name, args.state )
			.then(() => {
				callback();
			})
			.catch( callback );

	}

	_onFlowUserAutocomplete( callback, args ) {

		if( !this._eetlijst )
			return callback( new Error('not_logged_in') );

		this._eetlijst
			.getSummary()
			.then( summary => {

				let users = [];

				summary.users.forEach(function(user){
					users.push({
						name: user
					});
				})

				callback( null, users );
			})
			.catch( callback );

	}
}

module.exports = new App();