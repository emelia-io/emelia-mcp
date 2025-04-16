import mongoose from 'mongoose'

type ObjectId = mongoose.Schema.Types.ObjectId

export type DelayUnit = 'HOURS' | 'MINUTES' | 'DAYS'

export type MailEvent =
	| 'ALL'
	| 'NO_ACTIVITY'
	| 'SENT'
	| 'FIRST_OPEN'
	| 'OPENED'
	| 'CLICKED'
	| 'REPLIED'
	| 'RE_REPLY'
	| 'BOUNCED'
	| 'UNSUBSCRIBED'
	| 'INTERESTED'

export type EmailType = 'GOOGLE' | 'OFFICE' | 'EXHANGE' | 'SMTP' | 'GOOGLEIMAP'

export interface UserModel {
	name?: string
	cognitoUserId: string
	emailAddress: string
	emailVerified: boolean
	google?: {
		/** Présent uniquement si connection Google - on l'utilise pour se connecter à Emelia */
		googleUserId?: string
		/** Si `true`, l'utilisateur a défini un mot de passe pour son compte Emelia */
		passwordSet?: boolean
	}
	picture?: string
	/** id of stripe account */
	stripeAccount?: string
	/** Country code of the user */
	country?: string
	/** ID du Google Tracking */
	gc?: string
	showMailbox?: boolean
	subscription?: {
		activeBox?: number
		/** Applicable uniquement pour les utilisateurs français */
		vat?: 'incl' | 'excl'
		/** Si `true`, l'utilisateur est passé sur le nouveau système de facturation */
		newBillingSystem?: boolean
		/** Cycle de facturation mensuelle ou annuelle */
		billingPeriod?: 'm' | 'y'
		id: number
		expiration: Date
		stripeSubscriptionId: string
		additionalEmails?: mongoose.Types.DocumentArray<
			Document & {
				fromEmeliaSubscription?: boolean
				stripeSubscriptionId?: string
				expiration?: Date
			}
		>
		linkedinSlots?: mongoose.Types.DocumentArray<
			Document & {
				stripeSubscriptionId?: string
				expiration?: Date
			}
		>
		scrapper?: {
			stripeSubscriptionId?: string
			expiration: Date
			usedFreeScrap?: boolean
		}
		enrich?: {
			creditsRemaining?: number
			creditsSubscription?: number
			expiration: Date
			stripeSubscriptionId?: string
		}
	}
	joinedDate: Date
	resolveMailinblack?: boolean
	generateReplySentiment?: boolean
}

export interface APIModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	apiKey: string
	created_at: Date
	status: 'ENABLED' | 'DISABLED'
}

export interface ActionLogModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	apiId?: string | ObjectId | APIModel | (mongoose.Document & APIModel)
	action: string
	data: any
	date: Date
}

export interface LastInboxCheck {
	checkAfterDate?: Date
	checkBeforeDate?: Date
}

export type MergeInboxProviderSettings = 'all' | 'campaign' | 'disabled'

export interface MergedInboxSettingsModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	/** Contient un object qui a pour clé l'id du provider et la valeur pour savoir si c'est activé ou non */
	providersEnabled: Record<string, MergeInboxProviderSettings>
	/**
	 * Contient un objet qui contient l'id du provider et qui contient en valeur un autre objet avec en clé les filtres qui contient cet objet
	 * checkAfterDate: Date la plus récente qui a été fetch
	 * checkBeforeDate: Date la plus ancienne qui a été fetch
	 */
	lastInboxCheck: Record<string, Record<string, LastInboxCheck>>
}

export interface CouponModel {
	code: string
	userId?: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	redeemed: boolean
	dateUsed: Date
}

export interface CustomDomainModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	domainName: string
	status: 'OK' | 'PENDING' | 'DISABLED'
	dateAdded: Date
	checkAttempt: 0
}

export interface SignatureModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	/** Signature content in HTML */
	content: string
}

export interface BlacklistModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	/** Name of the blacklist */
	name: string
	blacklistContent: string
}

export interface LKContactModel {
	/** Contient l'ID Linkedin de l'utilisateur, utile pour les réponses. Si on ne l'a pas on le récupère dès qu'on fait une action */
	id?: string
	/** Contient le handle de l'url (ex: charles-lecalier-92er91) */
	handle?: string
	firstName?: string
	lastName?: string
	url: string
	custom: object
	status?: string
	lastContacted?: string
	lastReplied?: string
	integrationContactId?: string
	sentiment?: string
}

export interface ContactModel {
	firstName?: string
	lastName?: string
	phoneNumber?: string
	email: string
	custom: object
	replyRate?: '🔥' | '🧊'
	sentiment?: string
	mailsSent?: number
	interested?: string
	status?: string
	lastContacted?: string
	lastReplied?: string
	lastOpen?: string
	integrationContactId?: string
}

export interface ContactListModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	contacts: mongoose.Types.Array<ObjectId | ContactModel>
	/** Si `true`, la liste ne peut pas être récupéré en front */
	hidden?: boolean
}

export interface LKContactListModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	contacts: mongoose.Types.Array<ObjectId | LKContactModel>
	hidden?: boolean
}

export interface SequenceGenerationModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	startIndex: number
	endIndex: number
	apiKey: string
	output?: string
	status: 'running' | 'done' | 'error'
	contactsCount: number
	contactsProcessed: number
	error?: string
	generatedDate?: Date
}

export interface SequenceGenerationV2Model {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	draftFirstEmail: string
	lang: string
	politesse: string
	gender: string
	output?: string
	anthropicBatchId?: string
	status: 'running' | 'done' | 'error'
	contactsCount: number
	contactsProcessed: number
	error?: string
	generatedDate?: Date
}

export interface ScrapModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	/** DEPRECATED */
	auth:
		| string
		| ObjectId
		| LinkedinAuthModel
		| (mongoose.Document & LinkedinAuthModel)
	authes: Array<
		| string
		| ObjectId
		| LinkedinAuthModel
		| (mongoose.Document & LinkedinAuthModel)
	>
	/** Nom du scrap */
	name: string
	/** Lien de l'URL Sales Navigator */
	url: string
	/** DEPRECATED: ID d'enrichissement de Enrow */
	enrichId?: string
	/** IDs d'enrichissement de Enrow */
	enrichesId?: string[]
	/** Position dans le scrap, nombre de contacts scrapés */
	scrapIndex: number
	/** Si `true`, la recherche a été segmenté en plusieurs parti */
	segmented: boolean
	/** Les différents segments de la recherche */
	segments?: Array<{
		url: string
		scrapIndex: number
		count: number
		complete?: boolean
	}>
	/** Contient l'URL avec le CSV des données exportés/enrichi */
	output?: string
	/** Position dans l'enrichissement */
	enrichIndex: number
	/** Nombre d'email trouvé sur le total enrichIndex */
	enrichFound: number
	/** Si l'enrichissement a été activé ou pas */
	enrichEnabled: boolean
	/** Nombre total de contacts disponible pour cette recherche */
	totalContact: number
	/** Date à laquelle le scrap a été crée */
	date: Date
	/** Date estimé de fin du scrap - uniquement si segment */
	estimatedEnd?: Date
	/** Date de la derniere modif du document, utilise pour débug */
	lastUpdate?: Date
	/** Status de l'enrichissement */
	status: 'running' | 'enriching' | 'paused' | 'done' | 'error' | 'planified'
	deleted?: boolean
	error?: string
	webhooks?: Array<{
		webhookUrl: string
		events: string[]
	}>
	/** Si le filtrage est en cours  */
	processing?: boolean
	plannedStart?: Date
	scrapType?: 'people' | 'account'
}

export interface WarmupModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	provider:
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	startDate?: Date
	running: boolean
	emailsSent?: number
	emailsReceived?: number
	spamCount?: number
	conversationsCount?: number
	/** Si présent, on ne peut plus réactiver l'email warmup pour cette adresse email. Et le message apparait */
	disabledReason?: string
	score?: number
	stats?: Record<
		string /* yyyy-MM-dd*/,
		{ good: number; spam: number; bounce: number }
	>
	/** Contient l'étape actuelle. Si 1, on considère que la step 1 a été effectué */
	step: number
	retryCount: number
}

export interface WarmupConversationEmail {
	/** ID du warmup qui a envoyé le message */
	warmupId: string
	/** Thread ID pour répondre avec Google */
	threadId?: string
	/** Outlook ID pour répondre avec l'API de Microsoft */
	outlookMessageId?: string
	messageId?: string
	subject: string
	content: string
	date: Date
	maxStep?: number
}

export type WarmupPopulated = Document &
	Omit<WarmupModel, 'provider'> & {
		provider: EmailProviderModel & Document
	}

export interface WarmupConversationModel {
	from: string | ObjectId | WarmupModel | (mongoose.Document & WarmupModel)
	to: string | ObjectId | WarmupModel | (mongoose.Document & WarmupModel)
	status: 'active' | 'bounced' | 'disabled' | 'spam' | 'finished'
	/** Numéro de la séquence dans nos séquences pré-faite */
	sequenceNumber: number
	emailsSent: Array<WarmupConversationEmail>
	lastEvent?: Date
	getCurrentSender: () => Promise<[WarmupPopulated, WarmupPopulated]>
	getReceiver: () => Promise<[WarmupPopulated, WarmupPopulated] | null>
	maxStep?: number
}

export interface EnrichModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	/** Nom du scrap */
	name: string
	/** DEPRECATED: ID d'enrichissement de Enrow */
	enrichId?: string
	/** IDs d'enrichissement de Enrow */
	enrichesId?: string[]
	/** Position dans l'enrichissement */
	enrichIndex: number
	/** Nombre d'email trouvé sur le total enrichIndex */
	enrichFound: number
	deleted?: boolean
	/** Nombre total de contacts disponible pour cette recherche */
	totalContact: number
	/** Contient l'URL avec le CSV des données exportés/enrichi */
	output?: string
	/** Date à laquelle le scrap a été crée */
	date: Date
	/** Status de l'enrichissement */
	status: 'enriching' | 'paused' | 'done' | 'error'
	error?: string
}

export interface LinkedinAuthModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	/** Nom / Prénom du compte LinkedIn associé */
	name?: string
	/** Cookie li_at */
	token: string
	/** Cookie li_a */
	li_a?: string
	/** User-Agent */
	ua?: string
	/** Cookie JSESSIONID */
	jsessionid?: string
	status: 'valid' | 'invalid'
	metadata?: {
		id?: string
		handle?: string
		picture?: string
		fullName?: string
		hasPremium?: boolean
	}
	createdAt: Date
	disabled?: boolean
	hasAdvanced?: boolean
	viewport?: {
		width: number
		height: number
	}
	proxy?: {
		host: string
		port: number
		username?: string
		password?: string
	}
	additionnalsCookie?: any[]
}

export interface GoogleEmailModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	email: string
	access_token: string
	refresh_token: string
	expiration: Date
}

/**
 * Si un compte Google expire, on stock le processus pour le reconnecter
 */
export interface GoogleReconnectModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	providerId:
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	token: string
	successfulDate?: Date
	date: Date
}

/**
 * Si un compte Microsoft expire, on stock le processus pour le reconnecter
 */
export interface MicrosoftReconnectModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	providerId:
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	token: string
	successfulDate?: Date
	date: Date
}

export interface OfficeEmailModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	email: string
	access_token: string
	refresh_token: string
	expiration: Date
	/** Si `true`, on utilise les clés API de la nouvelle app microsoft, sinon les anciennes */
	newApp?: boolean
}

export interface HubspotModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	access_token: string
	refresh_token: string
	expiration: Date
}

export interface PipedriveModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	access_token: string
	refresh_token: string
	api_domain: string
	expiration: Date
}

export interface EmailProviderModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	customDomain?:
		| string
		| ObjectId
		| CustomDomainModel
		| (mongoose.Document & CustomDomainModel)
	senderName: string
	senderEmail: string
	senderPassword?: string
	emailType: EmailType
	smtp: {
		login?: string
		password?: string
		server: string
		port: number
		ssl: boolean
	}
	imap: {
		login?: string
		password?: string
		server: string
		port: number
		ssl: boolean
	}
	signature:
		| string
		| ObjectId
		| SignatureModel
		| (mongoose.Document & SignatureModel)
	/**
	 * Utilisé uniquement si une campagne utilise tout les providers !
	 * Sinon on utilise le `lastInboxCheck` de la campagne
	 */
	lastInboxCheck?: Record<string, Date>
	/** Si `disabled` vaut true, il s'agit d'un mail qui n'a pas été payé */
	disabled?: boolean
	/** Si `true`, le mail a été déconnecté et il faut le reconnecter */
	disconnected?: boolean
	warmup?: string | ObjectId | WarmupModel | (mongoose.Document & WarmupModel)
	health?:
		| string
		| ObjectId
		| EmailHealthModel
		| (mongoose.Document & EmailHealthModel)
}

export type StepType =
	| 'VISIT'
	| 'CONNECTION'
	| 'MESSAGE'
	| 'LIKE'
	| 'FOLLOW'
	| 'INMAIL'

export interface LinkedinCampaignModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	account?:
		| string
		| ObjectId
		| LinkedinAuthModel
		| (mongoose.Document & LinkedinAuthModel)
	schedule: {
		dailyContact: number
		timeZone: string
		days: number[]
		start: string
		end: string
		excludeAlreadyMessaged?: boolean
		exclude1stConn?: boolean
		excludeNoPictures?: boolean
	}
	steps: mongoose.Types.DocumentArray<
		Document & {
			stepType: StepType
			delay: {
				amount: number
				unit: DelayUnit
			}
			versions: mongoose.Types.DocumentArray<
				Document & {
					disabled?: boolean
					message: string
				}
			>
		}
	>
	recipients: {
		lists: mongoose.Types.Array<
			| string
			| ObjectId
			| LKContactListModel
			| (mongoose.Document & LKContactListModel)
		>
		contacts: mongoose.Types.Array<
			| string
			| ObjectId
			| LKContactModel
			| (mongoose.Document & LKContactModel)
		>
		processing: boolean
	}
	zapierData?: mongoose.Types.DocumentArray<
		Document & {
			webhookUrl: string
			events: string[]
		}
	>
	status: 'RUNNING' | 'PAUSED' | 'DRAFT' | 'FINISHED' | 'ARCHIVED'
	startAt?: Date
	createdAt: Date
	estimatedEnd?: Date
	plannedStart?: Date
	lastRefreshed?: Date
	/**
	 * Une fois la campagne lancé, on stock le user id Linkedin de l'utilisateur qui fait la campagne
	 * Si ce n'est pas le même, on bloque
	 */
	assignedSender?: string
	/** Dernière fois qu'on a checké les réponses sur cette campagne */
	lastInboxCheck?: Date
	hubspotIntegration: {
		hubspotId: string | ObjectId
		listId: number
		syncActivities?: boolean
		dynamic?: boolean
		lastSynced?: Date
		linkedinKey?: string // Only in LinkedinCampaignModel
	}
	pipedriveIntegration: {
		pipedriveId: string | ObjectId
		listId: number
		syncActivities?: boolean
		dynamic?: boolean
		lastSynced?: Date
		linkedinKey?: string // Only in LinkedinCampaignModel
	}
}

export interface CampaignModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	useManyProviders?: boolean
	providersUsed?: Array<
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	>
	provider:
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	name: string
	schedule: {
		bcc?: string
		/** Uniquement pour le premier mail, nombre de mail qu'on envoit chaque jour */
		dailyContact: number
		dailyLimit: number
		minInterval: number
		maxInterval: number
		blacklistUnsub: boolean
		trackLinks: boolean
		trackOpens: boolean
		timeZone: string
		days: number[]
		/** Heure de démarrage au format: 09:45 */
		start: string
		/** Heure de fin au format: 16:50 */
		end: string
		eventToStopMails: string[]
	}
	steps: mongoose.Types.DocumentArray<
		Document & {
			/** Nombre de jour avant qu'on envoit cette étape, si ça tombe un jour non ouvré
			 * on attend le prochain jour ouvré. Nécessaire à partir de la seconde étape uniquement
			 */
			delay?: {
				amount: number
				unit: DelayUnit
			}
			/* Contient un A/B testing, donc plusieurs combinaisons possible */
			versions: mongoose.Types.DocumentArray<
				Document & {
					subject?: string
					disabled?: boolean
					message: string
					attachments?: Array<{ name: string; url: string }>
					rawHtml?: boolean
					options?: {
						showHistory: boolean
						schedule: {
							// day 0 to 6
							day: number
							start: string
							end: string
						}[]
						trackLinks: boolean
						trackOpens: boolean
						provider:
							| string
							| ObjectId
							| EmailProviderModel
							| (mongoose.Document & EmailProviderModel)
					}
				}
			>
		}
	>
	recipients: {
		lists: mongoose.Types.Array<
			| string
			| ObjectId
			| ContactListModel
			| (mongoose.Document & ContactListModel)
		>
		contacts: mongoose.Types.Array<
			| string
			| ObjectId
			| ContactModel
			| (mongoose.Document & ContactModel)
		>
		processing: boolean
	}
	status: 'RUNNING' | 'PAUSED' | 'DRAFT' | 'FINISHED' | 'ARCHIVED'
	createdAt: Date
	zapierData?: mongoose.Types.DocumentArray<
		Document & {
			webhookUrl: string
			events: string[]
		}
	>
	hubspotIntegration: {
		hubspotId: string | ObjectId
		listId: number
		syncActivities?: boolean
		dynamic?: boolean
		lastSynced?: Date
	}
	pipedriveIntegration: {
		pipedriveId: string | ObjectId
		listId: number
		syncActivities?: boolean
		dynamic?: boolean
		lastSynced?: Date
	}
	startAt?: Date
	lastInboxCheck?: Date
	estimatedEnd?: Date
	plannedStart?: Date
	lastRefreshed?: Date
}

export type LinkedinEvent =
	| 'ALL'
	| 'NO_ACTIVITY'
	| 'VISITED'
	| 'INVITED'
	| 'ACCEPTED'
	| 'MESSAGE_SENT'
	| 'REPLIED'
	| 'RE_REPLY'
	| 'FOLLOWED'
	| 'LIKED'
	| 'FAILED_ACTION'

export interface LKActivityModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	campaign:
		| string
		| ObjectId
		| LinkedinCampaignModel
		| (mongoose.Document & LinkedinCampaignModel)
	authId:
		| string
		| ObjectId
		| LinkedinAuthModel
		| (mongoose.Document & LinkedinAuthModel)
	stepId: string
	versionId: string
	contact:
		| string
		| ObjectId
		| LKContactModel
		| (mongoose.Document & LKContactModel)
	event: LinkedinEvent
	customData: {
		link?: string
		email?: string
	}
	date: Date
}

export interface ActivityModel {
	userId?: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	campaign:
		| string
		| ObjectId
		| CampaignModel
		| (mongoose.Document & CampaignModel)
	stepId: string
	versionId: string
	providerId?: string
	contact:
		| string
		| ObjectId
		| ContactModel
		| (mongoose.Document & ContactModel)
	event: MailEvent
	replyData?:
		| string
		| ObjectId
		| ReplyMetadataModel
		| (mongoose.Document & ReplyMetadataModel)
	customData: {
		link?: string
		email?: string
		senderName?: string
		references?: string[]
		subject?: string
		messageId?: string
		content?: string
		text?: string
		date?: Date
		repliedTo?: string
		read?: boolean
		repliedOn?: Date
		replyContent?: string
		sentiment?: any
	}
	date: Date
}

export interface MailboxReplyModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	providerId: string
	/** Contient le messagerId ou le references[0], utilisé pour ne pas marquer les réponses en doubles */
	messageId: string
	replyData?:
		| string
		| ObjectId
		| ReplyMetadataModel
		| (mongoose.Document & ReplyMetadataModel)
	customData?: {
		threadId?: string
		messageId?: string
		content?: string
		link?: string
		providerId?: string
	}
	date: Date
	bounced?: boolean
}

export interface ReplyMetadataModel {
	repliedTo?: string
	repliedOn?: Date
	replyContent?: string
	read?: boolean
	email?: string
	references?: string[]
	messageId?: string
	senderName?: string
	subject?: string
	content?: string
	text?: string
	date?: Date
}

export interface VersionStat {
	sent: number
	to_send: number
	delivered: number
	first_open: number
	opened: number
	clicked: number
	unique_clicked: number
	replied: number
	bounced: number
	unsubscribed: number

	first_open_percent?: number
	clicked_percent?: number
	replied_percent?: number
	bounced_percent?: number
	unsubscribed_percent?: number
}

export type GlobalStat = Omit<VersionStat, 'to_send' | 'delivered'> & {
	progress_percent?: number
}

export interface ActivitiesCountModel {
	campaign:
		| string
		| ObjectId
		| CampaignModel
		| (mongoose.Document & CampaignModel)
	global: GlobalStat
	steps: Array<Array<VersionStat>>
	canceledByStep?: Record<string /* stepId */, number>
}

export interface TrackLinkModel {
	trackType: 'OPEN' | 'LINK' | 'UNSUBSCRIBED'
	campaign:
		| string
		| ObjectId
		| CampaignModel
		| (mongoose.Document & CampaignModel)
	stepId: string
	versionId: string
	contact:
		| string
		| ObjectId
		| ContactModel
		| (mongoose.Document & ContactModel)
	link: string
	originalLink?: string
}

export interface TemplateModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	name: string
	content: string
	rawHtml: boolean
}

export type Document = mongoose.Document

export interface EmailHealthModel {
	providerId:
		| string
		| ObjectId
		| EmailProviderModel
		| (mongoose.Document & EmailProviderModel)
	sendAbility: 'OK' | 'NOT_RECEIVED' | 'SENDING_ERROR'
	dkim: 'OK' | 'MISSING'
	blacklistCount: number
	mx: 'OK' | 'MISSING'
	dmarc: 'OK' | 'MISSING'
	spf: 'OK' | 'MISSING'
	lastCheck: Date
}

export interface MailinblackSolverModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	url: string
	status: string
	date: Date
}

export interface SequenceGenerationV2Job {
	generationId: string
	contactIndex: number
	contact: string
}

export interface EmailVerifierJob {
	generationId: string
	contactIndex: number
	contact: string
}

export interface EmailVerifierModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	enrowIds: string[]
	name: string
	contactsCount: number
	contactsProcessed: number
	emailColumn: string
	output: string
	generatedDate: Date
	status: 'running' | 'done' | 'error'
	error: string
	deleted?: boolean
}

export interface PhoneFinderModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	enrowIds: string[]
	name: string
	contactsCount: number
	contactsFound: number
	linkedinColumn: string
	output: string
	generatedDate: Date
	status: 'running' | 'done' | 'error'
	error: string
	deleted?: boolean
}

export interface UniquePhoneFinderModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	linkedinUrl: string
	phoneNumber?: string
	enrowId: string
	country?: string
	qualification: string
	status: 'running' | 'done' | 'error'
	date: string // ISO Date
}

export interface UniqueEmailVerifierModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	email: string
	enrowId: string
	qualification: string
	status: 'running' | 'done' | 'error'
	date: string // ISO Date
}

export interface UniqueEmailFinderModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	fullname: string
	companyName: string
	companyWebsite: string
	email?: string
	qualification?: string
	enrowId: string
	error?: string
	status: 'running' | 'done' | 'error'
	date: string // ISO Date
}

export interface MergeInboxReplyModel {
	userId: string | ObjectId | UserModel | (mongoose.Document & UserModel)
	providerId: string
	messageId: string
	repliedOn: Date
	content: string
	originalMessage?: string
}
